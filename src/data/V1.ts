import { AddressZero } from '@ethersproject/constants'
import {
  BigintIsh,
  ChainId,
  Currency,
  CurrencyAmount,
  ETHER,
  JSBI,
  MATIC_TOKEN,
  Pair,
  Route,
  Token,
  TokenAmount,
  Trade,
  TradeType,
  WETH
} from '@rcpswap/sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '../hooks'
import { useAllTokens } from '../hooks/Tokens'
import { useV1FactoryContract } from '../hooks/useContract'
import { Version } from '../hooks/useToggledVersion'
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleData } from '../state/multicall/hooks'
import { useETHBalances, useTokenBalance, useTokenBalances } from '../state/wallet/hooks'

export function useV1ExchangeAddress(tokenAddress?: string, chainId?: ChainId): string | undefined {
  const contract = useV1FactoryContract(chainId)

  const inputs = useMemo(() => [tokenAddress], [tokenAddress, chainId])
  return useSingleCallResult(contract, 'getExchange', inputs, chainId)?.result?.[0]
}

export class MockV1Pair extends Pair {
  constructor(etherAmount: BigintIsh, tokenAmount: TokenAmount) {
    super(tokenAmount, new TokenAmount(WETH[tokenAmount.token.chainId], etherAmount))
  }
}

function useMockV1Pair(inputCurrency?: Currency, chainId?: ChainId): MockV1Pair | undefined {
  const token = inputCurrency instanceof Token ? inputCurrency : undefined

  const isWETH = Boolean(token && token.equals(WETH[token.chainId]))
  const v1PairAddress = useV1ExchangeAddress(isWETH ? undefined : token?.address, chainId)
  const tokenBalance = useTokenBalance(v1PairAddress, token, chainId)
  const ETHBalance = useETHBalances([v1PairAddress], chainId)[v1PairAddress ?? '']

  return useMemo(
    () =>
      token && tokenBalance && ETHBalance && inputCurrency ? new MockV1Pair(ETHBalance.raw, tokenBalance) : undefined,
    [ETHBalance, inputCurrency, token, tokenBalance, chainId]
  )
}

// returns all v1 exchange addresses in the user's token list
export function useAllTokenV1Exchanges(chainId?: ChainId): { [exchangeAddress: string]: Token } {
  const allTokens = useAllTokens(chainId)
  const factory = useV1FactoryContract(chainId)
  const args = useMemo(() => Object.keys(allTokens).map(tokenAddress => [tokenAddress]), [allTokens])

  const data = useSingleContractMultipleData(factory, 'getExchange', args, chainId, NEVER_RELOAD)

  return useMemo(
    () =>
      data?.reduce<{ [exchangeAddress: string]: Token }>((memo, { result }, ix) => {
        if (result?.[0] && result[0] !== AddressZero) {
          memo[result[0]] = allTokens[args[ix][0]]
        }
        return memo
      }, {}) ?? {},
    [allTokens, args, data]
  )
}

// returns whether any of the tokens in the user's token list have liquidity on v1
export function useUserHasLiquidityInAllTokens(chainId?: ChainId): boolean | undefined {
  const { account } = useActiveWeb3React()

  const exchanges = useAllTokenV1Exchanges(chainId)

  const v1ExchangeLiquidityTokens = useMemo(
    () =>
      chainId ? Object.keys(exchanges).map(address => new Token(chainId, address, 18, 'UNI-V1', 'Uniswap V1')) : [],
    [chainId, exchanges]
  )

  const balances = useTokenBalances(account ?? undefined, v1ExchangeLiquidityTokens, chainId)

  return useMemo(
    () =>
      Object.keys(balances).some(tokenAddress => {
        const b = balances[tokenAddress]?.raw
        return b && JSBI.greaterThan(b, JSBI.BigInt(0))
      }),
    [balances]
  )
}

/**
 * Returns the trade to execute on V1 to go between input and output token
 */
export function useV1Trade(
  isExactIn?: boolean,
  inputCurrency?: Currency,
  outputCurrency?: Currency,
  exactAmount?: CurrencyAmount,
  inputChainId?: ChainId,
  outputChainId?: ChainId
): Trade | undefined {
  // get the mock v1 pairs
  const inputPair = useMockV1Pair(inputCurrency, inputChainId)
  const outputPair = useMockV1Pair(outputCurrency, outputChainId)

  const inputIsETH = inputCurrency === ETHER || inputCurrency === MATIC_TOKEN
  const outputIsETH = outputCurrency === ETHER || outputCurrency === MATIC_TOKEN

  // construct a direct or through ETH v1 route
  let pairs: Pair[] = []
  if (inputIsETH && outputPair) {
    pairs = [outputPair]
  } else if (outputIsETH && inputPair) {
    pairs = [inputPair]
  }
  // if neither are ETH, it's token-to-token (if they both exist)
  else if (inputPair && outputPair) {
    pairs = [inputPair, outputPair]
  }

  const route = inputCurrency && pairs && pairs.length > 0 && new Route(pairs, inputCurrency, outputCurrency)
  let v1Trade: Trade | undefined
  try {
    v1Trade =
      route && exactAmount
        ? new Trade(route, exactAmount, isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT)
        : undefined
  } catch (error) {
    console.debug('Failed to create V1 trade', error)
  }
  return v1Trade
}

export function getTradeVersion(trade?: Trade): Version | undefined {
  const isV1 = trade?.route?.pairs?.some(pair => pair instanceof MockV1Pair)
  if (isV1) return Version.v1
  if (isV1 === false) return Version.v2
  return undefined
}

// returns the v1 exchange against which a trade should be executed
export function useV1TradeExchangeAddress(trade: Trade | undefined): string | undefined {
  const tokenAddress: string | undefined = useMemo(() => {
    if (!trade) return undefined
    const isV1 = getTradeVersion(trade) === Version.v1
    if (!isV1) return undefined
    return trade.inputAmount instanceof TokenAmount
      ? trade.inputAmount.token.address
      : trade.outputAmount instanceof TokenAmount
        ? trade.outputAmount.token.address
        : undefined
  }, [trade])
  return useV1ExchangeAddress(tokenAddress)
}
