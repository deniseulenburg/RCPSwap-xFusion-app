import useENS from '../../hooks/useENS'
import { Version } from '../../hooks/useToggledVersion'
import { parseUnits } from '@ethersproject/units'
import { useQuery } from '@tanstack/react-query'
import { Currency, CurrencyAmount, JSBI, Token, TokenAmount, Trade, DEFAULT_CURRENCIES, Fraction } from '@venomswap/sdk'
import { ParsedQs } from 'qs'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useV1Trade } from '../../data/V1'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { useTradeExactIn, useTradeExactOut } from '../../hooks/Trades'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import { isAddress } from '../../utils'
import { AppDispatch, AppState } from '../index'
import { useCurrencyBalances } from '../wallet/hooks'

import {
  Field,
  replaceSwapState,
  selectCurrency,
  setRecipient,
  switchCurrencies,
  switchSwapMode,
  switchUltraMode,
  typeInput
} from './actions'
import { SwapState } from './reducer'
import useToggledVersion from '../../hooks/useToggledVersion'
import { useUserSlippageTolerance } from '../user/hooks'
import { computeSlippageAdjustedAmounts } from '../../utils/prices'
import { BASE_CURRENCY } from '../../connectors'
import useBlockchain from '../../hooks/useBlockchain'
import getBlockchainAdjustedCurrency from '../../utils/getBlockchainAdjustedCurrency'
import axios from 'axios'
import { useToken } from 'package/tokens'
import { usePoolsCodeMap } from 'package/pools/usePoolsCodeMap'
import { RPParams, Router } from 'package/router'
import { ChainId } from 'package/chain'
import { useGasPrice } from 'hooks/useGasPrice'
import { BigNumber } from 'ethers'
import { LiquidityProviders } from 'package/router/liquidity-providers'
import { RToken, RouteLeg, RouteStatus, getBetterRoute } from 'package/tines'
import { routeProcessor3Address } from 'package/route-processor'
import { Native } from 'package/currency'
import { PoolCode } from 'package/router/pools/PoolCode'

export function useSwapState(): AppState['swap'] {
  return useSelector<AppState, AppState['swap']>(state => state.swap)
}

export function useSwapActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void
  onSwitchTokens: (mode: number | undefined, value: string | undefined) => void
  onUserInput: (field: Field, typedValue: string) => void
  onChangeRecipient: (recipient: string | null) => void
  onSwitchSwapMode: () => void
  onSwitchUltraMode: () => void
} {
  const dispatch = useDispatch<AppDispatch>()
  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      const symbol: string = BASE_CURRENCY && BASE_CURRENCY.symbol ? BASE_CURRENCY.symbol : 'ETH'
      dispatch(
        selectCurrency({
          field,
          currencyId:
            currency instanceof Token
              ? currency.address
              : currency && DEFAULT_CURRENCIES.includes(currency)
              ? symbol
              : ''
        })
      )
    },
    [dispatch]
  )

  const onSwitchTokens = useCallback(
    (mode: number | undefined, value: string | undefined) => {
      dispatch(switchCurrencies({ mode, value }))
    },
    [dispatch]
  )

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch]
  )

  const onChangeRecipient = useCallback(
    (recipient: string | null) => {
      dispatch(setRecipient({ recipient }))
    },
    [dispatch]
  )

  const onSwitchSwapMode = useCallback(() => {
    dispatch(switchSwapMode())
  }, [dispatch])

  const onSwitchUltraMode = useCallback(() => {
    dispatch(switchUltraMode())
  }, [dispatch])

  return {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
    onChangeRecipient,
    onSwitchSwapMode,
    onSwitchUltraMode
  }
}

// try to parse a user entered amount for a given token
export function tryParseAmount(value?: string, currency?: Currency): CurrencyAmount | undefined {
  if (!value || !currency) {
    return undefined
  }
  try {
    const typedValueParsed = parseUnits(value, currency.decimals).toString()
    if (typedValueParsed !== '0') {
      return currency instanceof Token
        ? new TokenAmount(currency, JSBI.BigInt(typedValueParsed))
        : CurrencyAmount.ether(JSBI.BigInt(typedValueParsed))
    }
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error)
  }
  // necessary for all paths to return a value
  return undefined
}

const BAD_RECIPIENT_ADDRESSES: string[] = [
  '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', // v2 factory
  '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a', // v2 router 01
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' // v2 router 02
]

/**
 * Returns true if any of the pairs or tokens in a trade have the given checksummed address
 * @param trade to check for the given address
 * @param checksummedAddress address to check in the pairs and tokens
 */
function involvesAddress(trade: Trade, checksummedAddress: string): boolean {
  return (
    trade.route.path.some(token => token.address === checksummedAddress) ||
    trade.route.pairs.some(pair => pair.liquidityToken.address === checksummedAddress)
  )
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfo(): {
  currencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: CurrencyAmount }
  parsedAmount: CurrencyAmount | undefined
  v2Trade: Trade | undefined
  inputError?: string
  v1Trade: Trade | undefined
} {
  const { account } = useActiveWeb3React()

  const blockchain = useBlockchain()

  const toggledVersion = useToggledVersion()

  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    recipient
  } = useSwapState()

  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)
  const recipientLookup = useENS(recipient ?? undefined)
  const to: string | null = (recipient === null ? account : recipientLookup.address) ?? null

  const relevantTokenBalances = useCurrencyBalances(account ?? undefined, [
    inputCurrency ?? undefined,
    outputCurrency ?? undefined
  ])

  const isExactIn: boolean = independentField === Field.INPUT
  const parsedAmount = tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined)

  const bestTradeExactIn = useTradeExactIn(isExactIn ? parsedAmount : undefined, outputCurrency ?? undefined)
  const bestTradeExactOut = useTradeExactOut(inputCurrency ?? undefined, !isExactIn ? parsedAmount : undefined)

  const v2Trade = isExactIn ? bestTradeExactIn : bestTradeExactOut

  const currencyBalances = {
    [Field.INPUT]: relevantTokenBalances[0],
    [Field.OUTPUT]: relevantTokenBalances[1]
  }

  const currencies: { [field in Field]?: Currency } = {
    [Field.INPUT]: inputCurrency ?? undefined,
    [Field.OUTPUT]: outputCurrency ?? undefined
  }

  // get link to trade on v1, if a better rate exists
  const v1Trade = useV1Trade(isExactIn, currencies[Field.INPUT], currencies[Field.OUTPUT], parsedAmount)

  let inputError: string | undefined
  if (!account) {
    inputError = 'Connect Wallet'
  }

  if (!parsedAmount) {
    inputError = inputError ?? 'Enter an amount'
  }

  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? 'Select a token'
  }

  const formattedTo = isAddress(to)
  if (!to || !formattedTo) {
    inputError = inputError ?? 'Enter a recipient'
  } else {
    if (
      BAD_RECIPIENT_ADDRESSES.indexOf(formattedTo) !== -1 ||
      (bestTradeExactIn && involvesAddress(bestTradeExactIn, formattedTo)) ||
      (bestTradeExactOut && involvesAddress(bestTradeExactOut, formattedTo))
    ) {
      inputError = inputError ?? 'Invalid recipient'
    }
  }

  const [allowedSlippage] = useUserSlippageTolerance()

  const slippageAdjustedAmounts = v2Trade && allowedSlippage && computeSlippageAdjustedAmounts(v2Trade, allowedSlippage)

  const slippageAdjustedAmountsV1 =
    v1Trade && allowedSlippage && computeSlippageAdjustedAmounts(v1Trade, allowedSlippage)

  // compare input balance to max input based on version
  const [balanceIn, amountIn] = [
    currencyBalances[Field.INPUT],
    toggledVersion === Version.v1
      ? slippageAdjustedAmountsV1
        ? slippageAdjustedAmountsV1[Field.INPUT]
        : null
      : slippageAdjustedAmounts
      ? slippageAdjustedAmounts[Field.INPUT]
      : null
  ]

  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    const amountInCurrency = getBlockchainAdjustedCurrency(blockchain, amountIn?.currency)
    inputError = 'Insufficient ' + amountInCurrency?.symbol + ' balance'
  }

  return {
    currencies,
    currencyBalances,
    parsedAmount,
    v2Trade: v2Trade ?? undefined,
    inputError,
    v1Trade
  }
}

function parseCurrencyFromURLParameter(urlParam: any): string {
  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam)
    if (valid) return valid
    if (urlParam.toUpperCase() === BASE_CURRENCY.symbol) return BASE_CURRENCY.symbol as string
    if (valid === false) return BASE_CURRENCY.symbol as string
  }
  return BASE_CURRENCY.symbol ?? ''
}

function parseTokenAmountURLParameter(urlParam: any): string {
  return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam)) ? urlParam : ''
}

function parseIndependentFieldURLParameter(urlParam: any): Field {
  return typeof urlParam === 'string' && urlParam.toLowerCase() === 'output' ? Field.OUTPUT : Field.INPUT
}

const ENS_NAME_REGEX = /^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)?$/
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
function validatedRecipient(recipient: any): string | null {
  if (typeof recipient !== 'string') return null
  const address = isAddress(recipient)
  if (address) return address
  if (ENS_NAME_REGEX.test(recipient)) return recipient
  if (ADDRESS_REGEX.test(recipient)) return recipient
  return null
}

export function queryParametersToSwapState(parsedQs: ParsedQs): SwapState {
  let inputCurrency = parseCurrencyFromURLParameter(parsedQs.inputCurrency)
  let outputCurrency = parseCurrencyFromURLParameter(parsedQs.outputCurrency)
  const swapMode = parseInt(parseIndependentFieldURLParameter(parsedQs.swapMode))
  if (inputCurrency === outputCurrency) {
    if (typeof parsedQs.outputCurrency === 'string') {
      inputCurrency = ''
    } else {
      outputCurrency = ''
    }
  }

  const recipient = validatedRecipient(parsedQs.recipient)

  return {
    [Field.INPUT]: {
      currencyId: inputCurrency
    },
    [Field.OUTPUT]: {
      currencyId: outputCurrency
    },
    typedValue: parseTokenAmountURLParameter(parsedQs.exactAmount),
    independentField: parseIndependentFieldURLParameter(parsedQs.exactField),
    swapMode: isFinite(swapMode) ? swapMode : 0,
    recipient,
    isUltra: false
  }
}

// updates the swap state to use the defaults for a given network
export function useDefaultsFromURLSearch():
  | { inputCurrencyId: string | undefined; outputCurrencyId: string | undefined }
  | undefined {
  const { chainId } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  const parsedQs = useParsedQueryString()
  const [result, setResult] = useState<
    { inputCurrencyId: string | undefined; outputCurrencyId: string | undefined } | undefined
  >()

  useEffect(() => {
    if (!chainId) return
    const parsed = queryParametersToSwapState(parsedQs)

    dispatch(
      replaceSwapState({
        typedValue: parsed.typedValue,
        field: parsed.independentField,
        inputCurrencyId: parsed[Field.INPUT].currencyId,
        outputCurrencyId: parsed[Field.OUTPUT].currencyId,
        recipient: parsed.recipient,
        swapMode: 1,
        isUltra: false
      })
    )

    setResult({ inputCurrencyId: parsed[Field.INPUT].currencyId, outputCurrencyId: parsed[Field.OUTPUT].currencyId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, chainId])

  return result
}

export type XFusionSwapType = {
  error: boolean
  loading: boolean
  currencies?: { [field in Field]?: Currency }
  parsedAmount?: CurrencyAmount
  result?: {
    route?: {
      status?: RouteStatus
      fromToken?: Native | RToken
      toToken?: Native | RToken
      primaryPrice?: number
      swapPrice?: number
      amountIn?: number
      amountInBN?: string
      amountOut?: number
      amountOutBN?: string
      priceImpact?: number
      totalAmountOut?: number
      totalAmountOutBN?: string
      gasSpent?: number
      legs?: RouteLeg[]
      singleProviderRoute?: {
        provider: 'Sushi' | 'Arb' | 'RCP'
        amountOut: number
        amountOutBN: string
      }
      fee?: {
        amountOut: number
        amountOutBN: string
        isFusion: boolean
      }
    }
    args?: RPParams
  }
}

function useUpdate() {
  const [update, setUpdate] = useState(0)
  const [loading, setLoading] = useState(false)

  const { typedValue } = useSwapState()

  let timerId = 0

  const updater = async () => {
    timerId = (setTimeout(() => {
      setUpdate(prev => prev + 1)
      setLoading(false)
    }, 500) as unknown) as number
  }

  useEffect(() => {
    if (typedValue.length > 0 && +typedValue > 0) {
      setLoading(true)
      updater()
    } else {
      setLoading(false)
    }
    return () => {
      clearTimeout(timerId)
    }
  }, [typedValue])

  return { update, loading }
}

export function useXFusionSwap(): XFusionSwapType {
  const { account } = useActiveWeb3React()

  const {
    typedValue,
    swapMode,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    isUltra,
    recipient
  } = useSwapState()

  const { update, loading: isInputLoading } = useUpdate()

  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)

  const parsedAmount = tryParseAmount(typedValue, inputCurrency ?? undefined)

  const { data: inputToken } = useToken(inputCurrencyId)
  const { data: outputToken } = useToken(outputCurrencyId)

  const currencies: { [field in Field]?: Currency } = {
    [Field.INPUT]: inputCurrency ?? undefined,
    [Field.OUTPUT]: outputCurrency ?? undefined
  }

  const { data: poolsCodeMap } = usePoolsCodeMap(inputToken ?? undefined, outputToken ?? undefined)
  const gasPrice = useGasPrice()

  const { isError, isFetching, data, isLoading } = useQuery({
    queryKey: [
      'useTrade',
      { currencyA: inputCurrencyId, currencyB: outputCurrencyId, poolsCodeMap, isUltra, recipient, swapMode, update }
    ],
    queryFn: async () => {
      if (
        !poolsCodeMap ||
        !inputToken ||
        !outputToken ||
        typedValue.length === 0 ||
        +typedValue === 0 ||
        swapMode === 0 ||
        update === 0
      ) {
        return {}
      }

      const bestRoute = Router.findBestRoute(
        poolsCodeMap,
        ChainId.ARBITRUM_NOVA,
        inputToken,
        BigNumber.from(parsedAmount?.raw.toString() ?? '0'),
        outputToken,
        gasPrice ?? 10000000,
        isUltra ? 1500 : 100
      )

      const sushiPoolsCodeMap = new Map<string, PoolCode>()

      const sushiFilter = ['USDC', 'WETH', 'WBTC', 'USDT', 'DAI', 'ETH', inputToken.symbol, outputToken.symbol]

      Array.from(poolsCodeMap.entries()).forEach(item => {
        if (
          sushiFilter.find(v => v === item[1].pool.token0.symbol) &&
          sushiFilter.find(v => v === item[1].pool.token1.symbol)
        ) {
          sushiPoolsCodeMap.set(item[0], item[1])
        }
      })

      const sushiBestRoute = Router.findBestRoute(
        sushiPoolsCodeMap,
        ChainId.ARBITRUM_NOVA,
        inputToken,
        BigNumber.from(parsedAmount?.raw.toString() ?? '0'),
        outputToken,
        gasPrice ?? 10000000,
        100,
        [LiquidityProviders.SushiSwapV2, LiquidityProviders.SushiSwapV3]
      )

      const arbBestRoute = Router.findBestRoute(
        poolsCodeMap,
        ChainId.ARBITRUM_NOVA,
        inputToken,
        BigNumber.from(parsedAmount?.raw.toString() ?? '0'),
        outputToken,
        gasPrice ?? 10000000,
        1,
        [LiquidityProviders.ArbSwap]
      )

      const rcpBestRoute = Router.findBestRoute(
        poolsCodeMap,
        ChainId.ARBITRUM_NOVA,
        inputToken,
        BigNumber.from(parsedAmount?.raw.toString() ?? '0'),
        outputToken,
        gasPrice ?? 10000000,
        1,
        [LiquidityProviders.RCPSwap]
      )

      const bestSingleProviderRoute = getBetterRoute(sushiBestRoute, getBetterRoute(arbBestRoute, rcpBestRoute))
      const FEE_BP = parseInt(process.env?.REACT_APP_FEE_BP ?? '100')

      console.log(bestSingleProviderRoute)

      const feeAmountOut =
        (bestRoute?.amountOut ?? 0) >= 0
          ? (((bestRoute?.amountOut ?? 0) - (bestSingleProviderRoute?.amountOut ?? 0)) * FEE_BP) / 10000
          : 0
      const feeAmountOutBN = (bestRoute?.amountOutBN ?? BigNumber.from(0)).gte(
        bestSingleProviderRoute?.amountOutBN ?? BigNumber.from(0)
      )
        ? (bestRoute?.amountOutBN ?? BigNumber.from(0))
            .sub(bestSingleProviderRoute?.amountOutBN ?? BigNumber.from(0))
            .mul(FEE_BP)
            .div(10000)
            .toString()
        : '0'

      return new Promise(res =>
        setTimeout(
          () =>
            res({
              route: {
                status: bestRoute?.status,
                fromToken:
                  bestRoute?.fromToken?.address === '' ? Native.onChain(ChainId.ARBITRUM_NOVA) : bestRoute?.fromToken,
                toToken:
                  bestRoute?.toToken?.address === '' ? Native.onChain(ChainId.ARBITRUM_NOVA) : bestRoute?.toToken,
                primaryPrice: bestRoute?.primaryPrice,
                swapPrice: bestRoute?.swapPrice,
                amountIn: bestRoute?.amountIn,
                amountInBN: bestRoute?.amountInBN.toString(),
                amountOut: bestRoute?.amountOut,
                amountOutBN: bestRoute?.amountOutBN.toString(),
                priceImpact: bestRoute?.priceImpact,
                totalAmountOut: bestRoute?.totalAmountOut,
                totalAmountOutBN: bestRoute?.totalAmountOutBN.toString(),
                gasSpent: bestRoute?.gasSpent,
                legs: bestRoute?.legs,
                singleProviderRoute: {
                  provider:
                    bestSingleProviderRoute === sushiBestRoute
                      ? 'Sushi'
                      : bestSingleProviderRoute === arbBestRoute
                      ? 'Arb'
                      : 'RCP',
                  amountOut: bestSingleProviderRoute?.amountOut ?? 0,
                  amountOutBN: bestSingleProviderRoute?.amountOutBN?.toString() ?? '0'
                },
                fee: {
                  amount: feeAmountOut === 0 ? (bestRoute.amountOut * 100) / 10000 : feeAmountOut,
                  amountOutBN: BigNumber.from(feeAmountOutBN).isZero()
                    ? BigNumber.from(bestRoute.amountOutBN)
                        .mul(100)
                        .div(10000)
                    : feeAmountOutBN,
                  isFusion: BigNumber.from(feeAmountOutBN).gt(0)
                }
              },
              args:
                recipient || account
                  ? Router.routeProcessor2Params(
                      poolsCodeMap,
                      bestRoute,
                      inputToken,
                      outputToken,
                      (recipient || account) ?? '',
                      routeProcessor3Address[ChainId.ARBITRUM_NOVA]
                    )
                  : undefined
            }),
          0
        )
      )
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: false,
    enabled: Boolean(poolsCodeMap && inputToken && outputToken && update > 0)
  })

  // const { isError, data, isFetching } = useQuery({
  //   queryKey: ['xFusion', update],
  //   queryFn: async () => {
  //     try {
  //       if (inputCurrencyId && outputCurrencyId && typedValue && swapMode === 1) {
  //         const gasPrice = parseInt((await library?.getGasPrice())?.toString() ?? '10000000')

  //         const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/swap`, {
  //           params: {
  //             fromTokenId: inputCurrencyId,
  //             toTokenId: outputCurrencyId,
  //             amount: parsedAmount?.raw.toString() ?? '0',
  //             gasPrice: gasPrice,
  //             to: account,
  //             isUltra
  //           }
  //         })
  //         console.log(res.data)

  //         return res.data
  //       } else {
  //         return {}
  //       }
  //     } catch (err) {
  //       throw new Error('Failed to fetch xFusion router')
  //     }
  //   },
  //   initialData: {},
  //   refetchInterval: 30000,
  //   retry: false
  // })

  return {
    error: isError,
    loading:
      isFetching ||
      Boolean(isLoading && inputCurrencyId && outputCurrencyId && typedValue.length > 0 && +typedValue > 0) ||
      Boolean(isInputLoading && inputCurrencyId && outputCurrencyId && typedValue.length > 0 && +typedValue > 0),
    currencies,
    parsedAmount,
    result: (data ?? {}) as any
  }
}
