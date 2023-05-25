import { Currency, CurrencyAmount, Pair, Price, Token, TokenAmount, Trade } from '@venomswap/sdk'
import { BASES_TO_CHECK_FUSION_TRADES, CUSTOM_BASES, DexInfo, EXTERNAL_DEX_ADDRESSES } from '../constants'
import { useActiveWeb3React } from 'hooks'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { useEffect, useMemo, useState } from 'react'
import { abi as IUniswapV2PairABI } from '@venomswap/core/build/IUniswapV2Pair.json'
import flatMap from 'lodash.flatmap'
import { pack, keccak256 } from '@ethersproject/solidity'
import { getCreate2Address } from '@ethersproject/address'
import { Interface } from 'ethers/lib/utils'
import { useMultipleContractSingleData } from '../state/multicall/hooks'
import { PairState } from 'data/Reserves'
import axios from 'axios'

const PAIR_INTERFACE = new Interface(IUniswapV2PairABI)

function getAddress(dex: DexInfo, tokenA: Token, tokenB: Token): string {
  const tokens = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]

  return getCreate2Address(
    dex.factory,
    keccak256(['bytes'], [pack(['address', 'address'], [tokens[0].address, tokens[1].address])]),
    dex.initCode
  )
}

export function useAllDexPairs(currencies: [Currency | undefined, Currency | undefined][]) {
  const { chainId } = useActiveWeb3React()

  const tokens = useMemo(
    () =>
      currencies.map(([currencyA, currencyB]) => [
        wrappedCurrency(currencyA, chainId),
        wrappedCurrency(currencyB, chainId)
      ]),
    [chainId, currencies]
  )

  const pairAddresses = useMemo(
    () =>
      EXTERNAL_DEX_ADDRESSES.map(dex =>
        tokens.map(([tokenA, tokenB]) => {
          return tokenA && tokenB && !tokenA.equals(tokenB) ? getAddress(dex, tokenA, tokenB) : undefined
        })
      ),
    [tokens]
  )

  const results = useMultipleContractSingleData(pairAddresses.flat(), PAIR_INTERFACE, 'getReserves')

  const pairCount = pairAddresses[0].length

  return useMemo(() => {
    return EXTERNAL_DEX_ADDRESSES.map((_, i) =>
      results.slice(i * pairCount, (i + 1) * pairCount).map((result, j) => {
        const { result: reserves, loading } = result
        const tokenA = tokens[j][0]
        const tokenB = tokens[j][1]

        if (loading) return [PairState.LOADING, null]
        if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
        if (!reserves) return [PairState.NOT_EXISTS, null]

        const { reserve0, reserve1 } = reserves
        const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]

        return [
          PairState.EXISTS,
          new Pair(new TokenAmount(token0, reserve0.toString()), new TokenAmount(token1, reserve1.toString()))
        ]
      })
    )
  }, [results, tokens])
}

export function useAllDexCommonPairs(currencyA?: Currency, currencyB?: Currency) {
  const { chainId } = useActiveWeb3React()

  const bases: Token[] = chainId ? BASES_TO_CHECK_FUSION_TRADES[chainId] : []

  const [tokenA, tokenB] = chainId
    ? [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
    : [undefined, undefined]

  const basePairs: [Token, Token][] = useMemo(
    () =>
      flatMap(bases, (base): [Token, Token][] => bases.map(otherBase => [base, otherBase])).filter(
        ([t0, t1]) => t0.address !== t1.address
      ),
    [bases]
  )

  const allPairCombinations: [Token, Token][] = useMemo(
    () =>
      tokenA && tokenB
        ? [
            // the direct pair
            [tokenA, tokenB],
            // token A against all bases
            ...bases.map((base): [Token, Token] => [tokenA, base]),
            // token B against all bases
            ...bases.map((base): [Token, Token] => [tokenB, base]),
            // each base against all bases
            ...basePairs
          ]
            .filter((tokens): tokens is [Token, Token] => Boolean(tokens[0] && tokens[1]))
            .filter(([t0, t1]) => t0.address !== t1.address)
            .filter(([tokenA, tokenB]) => {
              if (!chainId) return true
              const customBases = CUSTOM_BASES[chainId]
              if (!customBases) return true

              const customBasesA: Token[] | undefined = customBases[tokenA.address]
              const customBasesB: Token[] | undefined = customBases[tokenB.address]

              if (!customBasesA && !customBasesB) return true

              if (customBasesA && !customBasesA.find(base => tokenB.equals(base))) return false
              if (customBasesB && !customBasesB.find(base => tokenA.equals(base))) return false

              return true
            })
        : [],
    [tokenA, tokenB, bases, basePairs, chainId]
  )

  const allPairs = useAllDexPairs(allPairCombinations)

  return useMemo(
    () =>
      allPairs.map(pairs =>
        Object.values(
          pairs
            .filter((result): result is [PairState.EXISTS, Pair] =>
              Boolean(result[0] === PairState.EXISTS && result[1])
            )
            .reduce<{ [pairAddress: string]: Pair }>((memo, [, curr]) => {
              memo[curr.liquidityToken.address] = memo[curr.liquidityToken.address] ?? curr
              return memo
            }, {})
        )
      ),
    [allPairs]
  )
}

export function useXFusionDex(
  inputCurrency: Currency | undefined,
  outputCurrency: Currency | undefined,
  inputAmount: CurrencyAmount | undefined,
  allPairs: Pair[][]
) {
  const { chainId } = useActiveWeb3React()
  const [result, setResult] = useState<TokenAmount>()
  const [routes, setRoutes] = useState<any>()

  const fetchFusionResult = async () => {
    if (!inputCurrency || !outputCurrency || !inputAmount) return
    try {
      const data = await axios.post('http://localhost:8001/api/swap/fusion', {
        inputCurrency: wrappedCurrency(inputCurrency, chainId),
        outputCurrency: wrappedCurrency(outputCurrency, chainId),
        inputAmount: inputAmount.raw.toString(),
        pairs: allPairs.map(pairs =>
          pairs.map(pair => ({
            reserve0: { token: pair.token0, amount: pair.reserve0.raw.toString() },
            reserve1: { token: pair.token1, amount: pair.reserve1.raw.toString() }
          }))
        )
      })

      if (!data.data) {
        setResult(undefined)
        setRoutes(undefined)
      } else {
        setResult(new TokenAmount(outputCurrency as Token, data.data.result))
        setRoutes(
          data.data.routes.map((route: any) => ({
            ...route,
            amount: new TokenAmount(inputCurrency as Token, route.amount)
          }))
        )
      }
    } catch (err) {
      console.log(err)
    }
  }
  useEffect(() => {
    if (inputCurrency && outputCurrency && inputAmount && allPairs[0].length) {
      fetchFusionResult()
    } else {
      setResult(undefined)
      setRoutes(undefined)
    }
  }, [inputCurrency, outputCurrency, inputAmount?.raw.toString(), JSON.stringify(allPairs)])

  return {
    result,
    routes
  }
}

export function useBestDexTrade(
  parsedAmount: CurrencyAmount | undefined,
  outputCurrency: Currency | undefined,
  pairs: Pair[][]
) {
  return useMemo(() => {
    if (parsedAmount && outputCurrency) {
      const trades = pairs
        .map((pair, i) => ({
          id: i,
          trade: pair.length > 0 ? Trade.bestTradeExactIn(pair, parsedAmount, outputCurrency)?.[0] : undefined
        }))
        .filter(trade => trade.trade !== undefined)

      const bestTrade =
        trades.length > 0
          ? trades.reduce((prev, cur, i) =>
              prev?.trade?.executionPrice.lessThan(
                cur?.trade?.executionPrice ?? new Price(parsedAmount.currency, outputCurrency, '0', '1')
              )
                ? cur
                : prev
            )
          : undefined

      return bestTrade
    } else {
      return undefined
    }
  }, [pairs, parsedAmount, outputCurrency])
}
