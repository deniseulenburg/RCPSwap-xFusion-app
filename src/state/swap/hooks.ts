import useENS from '../../hooks/useENS'
import { Version } from '../../hooks/useToggledVersion'
import { parseUnits } from '@ethersproject/units'
import { useQuery } from '@tanstack/react-query'
import { Currency, CurrencyAmount, JSBI, Token, TokenAmount, Trade, DEFAULT_CURRENCIES, Fraction, ChainId, WETH, ETHER } from '@rcpswap/sdk'
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
import { Symbiosis, TokenAmount as SymbiosisTokenAmount, Token as SymbiosisToken } from '../../package/symbiosis'

import {
  Field,
  replaceSwapState,
  selectChain,
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
import { useGasPrice } from 'hooks/useGasPrice'
import { BigNumber } from 'ethers'
import { LiquidityProviders } from 'package/router/liquidity-providers'
import { RToken, RouteLeg, RouteStatus, getBetterRoute } from 'package/tines'
import { routeProcessor3Address } from 'package/route-processor'
import { Native, Type, USDC, WETH9, amountSchema } from 'package/currency'
import { PoolCode } from 'package/router/pools/PoolCode'
import baseCurrencies from 'utils/baseCurrencies'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { USDC as USDC_NOVA } from 'constants/index'

export function useSwapState(): AppState['swap'] {
  return useSelector<AppState, AppState['swap']>(state => state.swap)
}

export function useSwapActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency, chainId: ChainId) => void
  onChainSelection: (field: Field, chain: ChainId) => void
  onSwitchTokens: (mode: number | undefined, value: string | undefined) => void
  onUserInput: (field: Field, typedValue: string) => void
  onChangeRecipient: (recipient: string | null) => void
  onSwitchSwapMode: () => void
  onSwitchUltraMode: () => void
} {
  const dispatch = useDispatch<AppDispatch>()
  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency, chainId: ChainId) => {
      const baseCurrency = baseCurrencies(chainId)[0]
      const symbol: string = baseCurrency && baseCurrency.symbol ? baseCurrency.symbol : 'ETH'
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

  const onChainSelection = useCallback((field: Field, chain: ChainId) => {
    dispatch(selectChain({ field, chain }))
  }, [dispatch])

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
    onChainSelection,
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
    [Field.INPUT]: { currencyId: inputCurrencyId, chainId: inputChainId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId, chainId: outputChainId },
    recipient,
    swapMode
  } = useSwapState()

  const inputCurrency = useCurrency(inputCurrencyId, inputChainId)
  const outputCurrency = useCurrency(outputCurrencyId, outputChainId)

  const recipientLookup = useENS(recipient ?? undefined)
  const to: string | null = (recipient === null ? account : recipientLookup.address) ?? null

  const relevantTokenBalance0 = useCurrencyBalances(account ?? undefined, [
    inputCurrency ?? undefined
  ], inputChainId)

  const relevantTokenBalance1 = useCurrencyBalances(account ?? undefined, [
    outputCurrency ?? undefined
  ], outputChainId)


  const isExactIn: boolean = independentField === Field.INPUT
  const parsedAmount = tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined)

  const bestTradeExactIn = useTradeExactIn(swapMode === 0 ? isExactIn ? parsedAmount : undefined : undefined, swapMode === 0 ? outputCurrency ?? undefined : undefined, ChainId.ARBITRUM_NOVA)
  const bestTradeExactOut = useTradeExactOut(swapMode === 0 ? inputCurrency ?? undefined : undefined, swapMode === 0 ? !isExactIn ? parsedAmount : undefined : undefined, ChainId.ARBITRUM_NOVA)

  const v2Trade = isExactIn ? bestTradeExactIn : bestTradeExactOut

  const currencyBalances = {
    [Field.INPUT]: relevantTokenBalance0[0],
    [Field.OUTPUT]: relevantTokenBalance1[0]
  }

  const currencies: { [field in Field]?: Currency } = {
    [Field.INPUT]: inputCurrency ?? undefined,
    [Field.OUTPUT]: outputCurrency ?? undefined
  }

  // get link to trade on v1, if a better rate exists
  const v1Trade = useV1Trade(isExactIn, swapMode === 0 ? currencies[Field.INPUT] : undefined, swapMode === 0 ? currencies[Field.OUTPUT] : undefined, swapMode === 0 ? parsedAmount : undefined, ChainId.ARBITRUM_NOVA, ChainId.ARBITRUM_NOVA)

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

  if (swapMode === 1 && parsedAmount && currencyBalances[Field.INPUT] && parsedAmount.greaterThan(currencyBalances[Field.INPUT])) {
    inputError = 'Insufficient ' + currencies[Field.INPUT]?.symbol + ' balance'
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
      currencyId: inputCurrency,
      chainId: ChainId.ARBITRUM_NOVA
    },
    [Field.OUTPUT]: {
      currencyId: outputCurrency,
      chainId: ChainId.ARBITRUM_NOVA
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
        isUltra: false,
        inputChainId: ChainId.ARBITRUM_NOVA,
        outputChainId: ChainId.ARBITRUM_NOVA
      })
    )

    setResult({ inputCurrencyId: parsed[Field.INPUT].currencyId, outputCurrencyId: parsed[Field.OUTPUT].currencyId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, chainId])

  return result
}

export type XFusionSwapType = {
  error: string | undefined
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
    tx?: RPParams
  }
  swapType: number
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
      setUpdate(0)
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

const symbiosis = new Symbiosis('mainnet', 'rcpswap-cross-chain')
const symbiosisSywapping = symbiosis.bestPoolSwapping()

export function useSymbiosis(account: string | undefined, inputCurrency: Currency | undefined, outputCurrency: Currency | undefined, inputCurrencyId: string | undefined, outputCurrencyId: string | undefined, inputChainId: ChainId | undefined, outputChainId: ChainId | undefined, parsedAmount: string | undefined, recipient: string | undefined, enabled?: boolean) {
  return useQuery({
    queryKey: ['useSymbiosisSwap', account, inputCurrencyId, outputCurrencyId, inputChainId, outputChainId, parsedAmount, enabled],
    queryFn: async () => {
      console.log('---fetching')
      const res = await symbiosisSywapping.exactIn({
        tokenAmountIn: new SymbiosisTokenAmount(new SymbiosisToken({
          address: inputCurrency instanceof Token ? inputCurrency.address : '',
          chainId: inputChainId as number,
          decimals: inputCurrency?.decimals ?? 18,
          name: inputCurrency?.name ?? '',
          symbol: inputCurrency?.symbol ?? '',
          isNative: inputCurrency instanceof Token ? false : true
        }), parsedAmount ?? '0'),
        tokenOut: new SymbiosisToken({
          address: outputCurrency instanceof Token ? outputCurrency.address : '',
          chainId: outputChainId as number,
          decimals: outputCurrency?.decimals ?? 18,
          name: outputCurrency?.name ?? '',
          symbol: outputCurrency?.symbol ?? '',
          isNative: outputCurrency instanceof Token ? false : true
        }),
        from: account ?? '0xd52c556ecbd260cf3bf5b78f3f94d6878939adf7',
        to: recipient ?? account ?? '0xd52c556ecbd260cf3bf5b78f3f94d6878939adf7',
        deadline: Math.floor(Date.now() / 1e3) + 604800,
        slippage: 300
      });
      return {
        route: {
          amountOut: res?.tokenAmountOut?.toExact(),
          amountOutBN: res?.tokenAmountOut?.raw?.toString(),
        },
        args: res?.transactionRequest
      }
    },
    enabled: Boolean(enabled && inputChainId !== undefined && outputChainId !== undefined && inputCurrency && outputCurrency && parsedAmount),
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  })
}

export function useXFusion(account: string | undefined, inputToken: Type | undefined, outputToken: Type | undefined, amount: string | undefined, enabled: boolean | undefined, poolsCodeMap: Map<string, PoolCode> | undefined, isUltra: boolean | undefined, recipient: string | undefined) {
  const gasPrice = useGasPrice(ChainId.ARBITRUM_NOVA)

  return useQuery({
    queryKey: [
      'useTrade',
      { inputToken, outputToken, isUltra, recipient, poolsCodeMap, amount, account }
    ],
    queryFn: async () => {
      if (
        !poolsCodeMap ||
        !inputToken ||
        !outputToken || !amount ||
        amount.length === 0 ||
        +amount === 0
      ) {
        return {}
      }

      const bestRoute = Router.findBestRoute(
        poolsCodeMap,
        ChainId.ARBITRUM_NOVA,
        inputToken,
        BigNumber.from(amount),
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
        BigNumber.from(amount),
        outputToken,
        gasPrice ?? 10000000,
        100,
        [LiquidityProviders.SushiSwapV2, LiquidityProviders.SushiSwapV3]
      )

      const arbBestRoute = Router.findBestRoute(
        poolsCodeMap,
        ChainId.ARBITRUM_NOVA,
        inputToken,
        BigNumber.from(amount),
        outputToken,
        gasPrice ?? 10000000,
        1,
        [LiquidityProviders.ArbSwap]
      )

      const rcpBestRoute = Router.findBestRoute(
        poolsCodeMap,
        ChainId.ARBITRUM_NOVA,
        inputToken,
        BigNumber.from(amount),
        outputToken,
        gasPrice ?? 10000000,
        1,
        [LiquidityProviders.RCPSwap]
      )

      const bestSingleProviderRoute = getBetterRoute(sushiBestRoute, getBetterRoute(arbBestRoute, rcpBestRoute))
      const FEE_BP = parseInt(process.env?.REACT_APP_FEE_BP ?? '100')

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
        : BigNumber.from(0)

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
                  amount: feeAmountOut === 0 ? (bestRoute.amountOut * 100) / 10000 : feeAmountOut + (bestRoute.amountOut * 30) / 10000,
                  amountOutBN: feeAmountOutBN.isZero()
                    ? BigNumber.from(bestRoute.amountOutBN)
                      .mul(100)
                      .div(10000)
                    : feeAmountOutBN.add(BigNumber.from(bestRoute.amountOutBN)
                      .mul(30)
                      .div(10000)),
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
    refetchInterval: 20000,
    refetchOnWindowFocus: false,
    enabled: Boolean(poolsCodeMap && inputToken && outputToken && amount && enabled)
  })
}

export function useLocalFusion(account: string | undefined, inputCurrency: Currency | undefined, outputCurrency: Currency | undefined, inputCurrencyId: string | undefined, outputCurrencyId: string | undefined, inputChainId: ChainId | undefined, outputChainId: ChainId | undefined, parsedAmount: CurrencyAmount | undefined, isUltra: boolean | undefined, recipient: string | undefined, enabled: boolean | undefined, update: number) {
  const { data: inputToken } = useToken(inputCurrencyId, inputChainId, enabled)
  const { data: outputToken } = useToken(outputCurrencyId, outputChainId, enabled)

  const { data: poolsCodeMap } = usePoolsCodeMap(inputToken ?? undefined, outputToken ?? undefined, enabled)

  const { isFetching, data, error, isLoading } = useXFusion(account, inputToken ?? undefined, outputToken ?? undefined, parsedAmount?.raw.toString(), enabled && update > 0, poolsCodeMap, isUltra, recipient)

  return {
    isLoading: isFetching || Boolean(isLoading && inputCurrencyId && outputCurrencyId && parsedAmount),
    data: {
      route: (data as any)?.route,
      tx: (data as any)?.args ? {
        ...(data as any).args,
        chainId: ChainId.ARBITRUM_NOVA,
        address: routeProcessor3Address[ChainId.ARBITRUM_NOVA]
      } : undefined
    },
    error
  }
}

// export function useCrossInFusion(account: string | undefined, inputCurrency: Currency | undefined, outputCurrency: Currency | undefined, inputCurrencyId: string | undefined, outputCurrencyId: string | undefined, inputChainId: ChainId | undefined, outputChainId: ChainId | undefined, parsedAmount: CurrencyAmount | undefined, isUltra: boolean | undefined, recipient: string | undefined, enabled: boolean | undefined, update: number) {
//   const isUSDC = inputCurrencyId?.toLowerCase() === USDC_NOVA.address.toLowerCase()

//   const { data: inputToken } = useToken(inputCurrencyId, inputChainId, enabled && !isUSDC)
//   const outputToken = WETH9[ChainId.ARBITRUM_NOVA]

//   const { data: poolsCodeMap } = usePoolsCodeMap(inputToken ?? undefined, outputToken ?? undefined, enabled && !isUSDC)

//   const { isFetching: isFusionFetching, data: fusionData, isLoading: isFusionLoading, error: fusionError } = useXFusion(account, inputToken ?? undefined, outputToken, parsedAmount?.raw.toString(), enabled && update > 0 && !isUSDC, poolsCodeMap, isUltra, recipient)

//   const amountOut = isUSDC ? parsedAmount?.raw?.toString() : (fusionData as any) && (fusionData as any).route && (fusionData as any).route.amountOutBN ? BigNumber.from((fusionData as any).route.amountOutBN).sub(BigNumber.from((fusionData as any)?.fee?.amountOutBN ?? '0')) : undefined

//   const { isFetching: isSymbiosisFetching, data: symbiosisData, isLoading: isSymbiosisLoading, error: symbiosisError } = useSymbiosis(account, ETHER, outputCurrency ?? undefined, inputChainId, outputChainId, amountOut?.toString(), recipient, enabled && update > 0)

//   return {
//     data: {
//       route: (symbiosisData as any)?.route,
//       tx: [!isUSDC ? (fusionData as any)?.args ? {
//         ...(fusionData as any).args,
//         chainId: ChainId.ARBITRUM_NOVA,
//         address: routeProcessor3Address[ChainId.ARBITRUM_NOVA]
//       } : undefined : undefined, (symbiosisData as any)?.args ? { ...(symbiosisData as any)?.args, bridge: 0 } : undefined]
//     },
//     isLoading: isFusionFetching || isSymbiosisFetching || Boolean(!isUSDC && isFusionLoading && inputCurrencyId && outputCurrencyId && parsedAmount) || Boolean(isSymbiosisLoading && inputCurrencyId && outputCurrencyId && parsedAmount),
//     error: fusionError ?? symbiosisError
//   }
// }

export function useCrossFusion(account: string | undefined, inputCurrency: Currency | undefined, outputCurrency: Currency | undefined, inputCurrencyId: string | undefined, outputCurrencyId: string | undefined, inputChainId: ChainId | undefined, outputChainId: ChainId | undefined, parsedAmount: CurrencyAmount | undefined, isUltra: boolean | undefined, recipient: string | undefined, enabled: boolean | undefined, update: number) {

  const { isFetching: isSymbiosisFetching, data: symbiosisData, isLoading: isSymbiosisLoading, error: symbiosisError } = useSymbiosis(account, inputCurrency ?? undefined, outputCurrency ?? undefined, inputCurrencyId, outputCurrencyId, inputChainId, outputChainId, parsedAmount?.raw?.toString(), recipient, enabled && update > 0)

  return {
    data: {
      route: symbiosisData?.route,
      tx: (symbiosisData as any)?.args
    },
    isLoading: isSymbiosisFetching || Boolean(isSymbiosisLoading && inputCurrencyId && outputCurrencyId && parsedAmount),
    error: symbiosisError
  }
}

export function useXFusionSwap(): XFusionSwapType {
  const { account } = useActiveWeb3React()

  const {
    typedValue,
    swapMode,
    [Field.INPUT]: { currencyId: inputCurrencyId, chainId: inputChainId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId, chainId: outputChainId },
    isUltra,
    recipient
  } = useSwapState()

  const { update, loading: isInputLoading } = useUpdate()

  const crossChainMode = inputChainId === ChainId.ARBITRUM_NOVA && outputChainId === ChainId.ARBITRUM_NOVA ? 0 : 1;

  const inputCurrency = useCurrency(inputCurrencyId, inputChainId)
  const outputCurrency = useCurrency(outputCurrencyId, outputChainId)

  const currencies: { [field in Field]?: Currency } = {
    [Field.INPUT]: inputCurrency ?? undefined,
    [Field.OUTPUT]: outputCurrency ?? undefined
  }

  const parsedAmount = tryParseAmount(typedValue, inputCurrency ?? undefined)

  const localFusion = useLocalFusion(account ?? undefined, inputCurrency ?? undefined, outputCurrency ?? undefined, inputCurrencyId, outputCurrencyId, inputChainId, outputChainId, parsedAmount, isUltra, recipient ?? undefined, crossChainMode === 0 && swapMode === 1, update)

  // const crossInFusion = useCrossInFusion(account ?? undefined, inputCurrency ?? undefined, outputCurrency ?? undefined, inputCurrencyId, outputCurrencyId, inputChainId, outputChainId, parsedAmount, isUltra, recipient ?? undefined, crossChainMode === 1 && swapMode === 1, update)

  const crossFusion = useCrossFusion(account ?? undefined, inputCurrency ?? undefined, outputCurrency ?? undefined, inputCurrencyId, outputCurrencyId, inputChainId, outputChainId, parsedAmount, isUltra, recipient ?? undefined, crossChainMode === 1 && swapMode === 1, update)

  const swapResult = crossChainMode === 0 ? localFusion : crossFusion

  let error;
  if (swapResult.error) {
    if ((swapResult.error as any)?.code === 0) error = 'Swap will be reverted'
    if ((swapResult.error as any)?.code === 2) error = 'The amount is too low'
  }
  return {
    error: error,
    loading: swapResult?.isLoading || Boolean(isInputLoading && inputCurrencyId && outputCurrencyId && typedValue.length > 0 && +typedValue > 0),
    currencies,
    parsedAmount,
    result: (swapResult?.data ?? {}) as any,
    swapType: crossChainMode
  }
}
