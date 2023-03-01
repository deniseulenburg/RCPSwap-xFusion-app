import useENS from '../../hooks/useENS'
import { Version } from '../../hooks/useToggledVersion'
import { parseUnits } from '@ethersproject/units'
import { Currency, CurrencyAmount, JSBI, Token, TokenAmount, Trade, DEFAULT_CURRENCIES, Pair } from '@venomswap/sdk'
import { ParsedQs } from 'qs'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useV1Trade } from '../../data/V1'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { useTradeExactIn, useTradeExactOut } from '../../hooks/Trades'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import { getContract, isAddress } from '../../utils'
import { AppDispatch, AppState } from '../index'
import { useCurrencyBalances } from '../wallet/hooks'
import { abi as IUniswapV2PairABI } from '@venomswap/core/build/IUniswapV2Pair.json'

import {
  Field,
  replaceSwapState,
  selectCurrency,
  setRecipient,
  switchCurrencies,
  switchSwapMode,
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
import { WETH } from '@venomswap/sdk'
import { Interface } from 'ethers/lib/utils'
import { toCallKey } from 'state/multicall/actions'
import chunkArray from 'utils/chunkArray'
import { retry } from 'utils/retry'
import { MULTICALL_ABI, MULTICALL_NETWORKS } from 'constants/multicall'
import { useMulticallContract } from 'hooks/useContract'
import { BigNumber, Contract, ethers } from 'ethers'
import { FUSION_CONTRACT } from 'contracts'

export function useSwapState(): AppState['swap'] {
  return useSelector<AppState, AppState['swap']>(state => state.swap)
}

export function useSwapActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void
  onSwitchTokens: (mode: number | undefined, value: string | undefined) => void
  onUserInput: (field: Field, typedValue: string) => void
  onChangeRecipient: (recipient: string | null) => void
  onSwitchSwapMode: () => void
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

  return {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
    onChangeRecipient,
    onSwitchSwapMode
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
    recipient
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
        swapMode: parsed.swapMode
      })
    )

    setResult({ inputCurrencyId: parsed[Field.INPUT].currencyId, outputCurrencyId: parsed[Field.OUTPUT].currencyId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, chainId])

  return result
}

export async function getAllTokens() {
  const data = await axios.get('http://localhost:8001/api/token/all')
  return data.data
}

export async function getAllDexes() {
  const data = await axios.get('http://localhost:8001/api/swap/dexes')
  return data.data
}

export async function getAllPools() {
  const data = await axios.get('http://localhost:8001/api/swap/pools')
  return data.data
}

export async function getMixSwap(tokenIn: string, tokenOut: string, amountIn: string) {
  const data = await axios.post('http://localhost:8001/api/swap/mixswap', {
    addressIn: tokenIn,
    addressOut: tokenOut,
    amountIn
  })
  return data.data
}

export async function getDexPair(pool: any, multiContract: Contract, tokens: any) {
  const PAIR_INTERFACE = new Interface(IUniswapV2PairABI)

  const fragment = PAIR_INTERFACE.getFunction('getReserves')
  const callData = PAIR_INTERFACE.encodeFunctionData(fragment)

  const calls = pool.map((item: any) => ({ address: item.address, callData }))
  const chunkedCalls = chunkArray(calls, 30)
  const results = await Promise.all(
    chunkedCalls.map(async (chunk, index) => {
      const { promise } = retry(() => multiContract.aggregate(chunk.map((obj: any) => [obj.address, obj.callData])), {
        n: Infinity,
        minWait: 2500,
        maxWait: 3500
      })
      const result: any = await promise
      return { result: result[1], index }
    })
  )
  results.sort((a, b) => (a.index > b.index ? 1 : -1))

  const reserveEncoded = results.map(item => item.result).flat()
  const abiCoder = new ethers.utils.AbiCoder()
  const pairs = pool.map((item: any, index: number) => {
    const decoded = abiCoder.decode(['uint256', 'uint256', 'uint256'], reserveEncoded[index])
    const token0 = tokens.find((token: any) => token?.address.toLowerCase() === item.token0.toLowerCase())
    const token1 = tokens.find((token: any) => token?.address.toLowerCase() === item.token1.toLowerCase())
    return new Pair(
      new TokenAmount(
        new Token(42170, token0?.address ?? item.token0, token0?.decimals ?? 18, token0?.symbol, token0?.name),
        decoded[0]
      ),
      new TokenAmount(
        new Token(42170, token1?.address ?? item.token1, token1?.decimals ?? 18, token1?.symbol, token1?.name),
        decoded[1]
      )
    )
  })
  return pairs
}

export function useBestPriceSwap() {
  const { library } = useActiveWeb3React()
  const multiContract = useMulticallContract()

  const [bestSwap, setBestSwap] = useState<{
    amountIn: CurrencyAmount | undefined
    type: number
    price: number
    tokenIn?: Currency
    tokenOut?: Currency
    amounts?: number[]
    trade?: string[]
    dex?: number
    maxMultihop?: { trade: Trade; index: number }
    fee?: number
  }>()
  const [loading, setLoading] = useState(false)
  const {
    swapMode,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId }
  } = useSwapState()

  const inputCurrency = useCurrency(inputCurrencyId)

  const outputCurrency = useCurrency(outputCurrencyId)
  const parsedAmount = tryParseAmount(typedValue, inputCurrency ?? undefined)
  useEffect(() => {
    async function getBestSwap() {
      setLoading(true)
      if (inputCurrencyId && outputCurrencyId && parseFloat(typedValue) > 0 && swapMode === 1 && multiContract) {
        setBestSwap({ type: -1, price: 0, amountIn: parsedAmount })
        const mixSwap = await getMixSwap(
          inputCurrencyId === 'ETH' ? WETH[42170].address : inputCurrencyId,
          outputCurrencyId === 'ETH' ? WETH[42170].address : outputCurrencyId,
          typedValue
        )
        const pools = await getAllPools()
        const tokens = await getAllTokens()
        const tokenIn = tokens.find(
          (token: any) =>
            token?.address.toLowerCase() ===
            (inputCurrencyId === 'ETH' ? WETH[42170].address : inputCurrencyId).toLowerCase()
        )
        const tokenOut = tokens.find(
          (token: any) =>
            token?.address.toLowerCase() ===
            (outputCurrencyId === 'ETH' ? WETH[42170].address : outputCurrencyId).toLowerCase()
        )

        const bestTrades: { trade: Trade; index: number }[] = await Promise.all(
          pools.map(async (pool: any, index: number) => {
            const pairs = await getDexPair(pool, multiContract, tokens)
            const bestTrade = Trade.bestTradeExactIn(
              pairs,
              new TokenAmount(
                new Token(
                  42170,
                  tokenIn?.address ?? inputCurrencyId,
                  tokenIn?.decimals ?? 18,
                  tokenIn.symbol,
                  tokenIn.name
                ),
                ethers.utils.parseUnits(typedValue, tokenIn.decimals ?? 18).toString()
              ),
              new Token(
                42170,
                tokenOut?.address ?? outputCurrencyId,
                tokenOut?.decimals ?? 18,
                tokenOut?.symbol,
                tokenOut?.name
              )
            )
            return { trade: bestTrade[0], index }
          })
        )

        let maxTrade = 0,
          maxIndex = -1
        for (let index = 0; index < bestTrades.length; index++) {
          if (maxTrade < parseFloat(bestTrades[index]?.trade?.outputAmount?.toExact() ?? 0)) {
            ;(maxTrade = parseFloat(bestTrades[index]?.trade?.outputAmount?.toExact() ?? 0)), (maxIndex = index)
          }
        }

        if (maxIndex === -1) {
          setBestSwap({
            type: -1,
            amountIn: parsedAmount,
            price: 0,
            tokenIn: inputCurrency ?? undefined,
            tokenOut: outputCurrency ?? undefined
          })
        } else {
          if (mixSwap.result >= maxTrade) {
            const fusionContract = new ethers.Contract(FUSION_CONTRACT.address, FUSION_CONTRACT.abi, library)
            const feeRate = await fusionContract.fee()
            const fee =
              ((mixSwap.result - parseFloat(bestTrades[maxIndex].trade.outputAmount.toExact())) * (feeRate ?? 0)) / 1000
            setBestSwap({
              type: 0,
              amountIn: parsedAmount,
              price: mixSwap.result - fee,
              amounts: mixSwap.amounts,
              tokenIn: inputCurrency ?? undefined,
              tokenOut: outputCurrency ?? undefined,
              maxMultihop: bestTrades[maxIndex],
              fee
            })
          } else
            setBestSwap({
              type: 1,
              price: maxTrade,
              amountIn: parsedAmount,
              dex: maxIndex,
              trade: bestTrades[maxIndex].trade.route.path.map((path: any) => path.address),
              tokenIn: inputCurrency ?? undefined,
              tokenOut: outputCurrency ?? undefined,
              maxMultihop: bestTrades[maxIndex]
            })
        }
      }
      setLoading(false)
    }
    getBestSwap()
  }, [inputCurrencyId, outputCurrencyId, typedValue, swapMode, multiContract])
  return { bestSwap, loading }
}
