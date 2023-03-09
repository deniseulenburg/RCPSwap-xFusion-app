import { Currency, CurrencyAmount, Pair, Token, TokenAmount, Trade, WETH } from '@venomswap/sdk'
import axios from 'axios'
import { Contract, ethers } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useActiveWeb3React } from 'hooks'
import { useEffect, useState } from 'react'
import chunkArray from 'utils/chunkArray'
import { retry } from 'utils/retry'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { useMulticallContract } from './useContract'
import { abi as IUniswapV2PairABI } from '@venomswap/core/build/IUniswapV2Pair.json'
import { useSwapState } from 'state/swap/hooks'
import { Field } from 'state/swap/actions'
import { MULTICALL_ABI, MULTICALL_NETWORKS } from 'constants/multicall'

export function useDexList() {
  const [dexes, setDexes] = useState<any>()

  useEffect(() => {
    const getDexes = async () => {
      const data = await axios.get('http://localhost:8001/api/swap/dexes')
      setDexes(data.data)
    }
    getDexes()
  }, [])
  return dexes
}

export function useAllPools() {
  const [pools, setPools] = useState<any>()

  useEffect(() => {
    const getAllPools = async () => {
      const data = await axios.get('http://localhost:8001/api/swap/pools')
      setPools(data.data)
    }
    getAllPools()
  }, [])

  return pools
}

export function useAllTokens() {
  const [tokens, setTokens] = useState<any>()

  useEffect(() => {
    const getAllTokens = async () => {
      const data = await axios.get('http://localhost:8001/api/token/all')
      setTokens(data.data)
    }
    getAllTokens()
  }, [])

  return tokens
}

async function getDexPair(pool: any, multiContract: Contract, tokens: any) {
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

export function useBestMultihops(
  amountIn: CurrencyAmount | undefined,
  outputCurrency: Currency | undefined,
  update: boolean,
  confirm: boolean
) {
  const [maxTrade, setMaxTrade] = useState<{ trade?: Trade; index: number } | undefined>()
  const [loading, setLoading] = useState<boolean>(false)

  const { swapMode } = useSwapState()

  const { chainId } = useActiveWeb3React()

  const pools = useAllPools()

  const tokens = useAllTokens()

  const multiContract = useMulticallContract()

  useEffect(() => {
    if (!confirm) setMaxTrade(undefined)
    const getBestTrades = async () => {
      setLoading(true)
      if (amountIn && outputCurrency && pools && tokens && swapMode === 1 && multiContract) {
        const bestTrades: { trade?: Trade; index: number }[] = await Promise.all(
          pools.map(async (pool: any, index: number) => {
            const pairs = await getDexPair(pool, multiContract, tokens)
            const bestTrade = Trade.bestTradeExactIn(
              pairs,
              amountIn,
              new Token(
                42170,
                wrappedCurrency(outputCurrency, chainId)?.address ?? '',
                outputCurrency?.decimals ?? 18,
                outputCurrency?.symbol,
                outputCurrency?.name
              )
            )
            return { trade: bestTrade[0], index }
          })
        )
        let maxTrade: CurrencyAmount | undefined = undefined,
          maxIndex = -1
        bestTrades.forEach((trade, index) => {
          if (trade.trade && (!maxTrade || maxTrade.lessThan(trade.trade.outputAmount)))
            (maxTrade = trade?.trade?.outputAmount), (maxIndex = index)
        })

        setMaxTrade({ trade: maxTrade ? bestTrades[maxIndex].trade : undefined, index: maxTrade ? maxIndex : -1 })
      }
      setLoading(false)
    }
    if (update) getBestTrades()
  }, [pools, tokens, amountIn?.currency.symbol, outputCurrency?.symbol, swapMode, update, multiContract])

  return { result: maxTrade, loading }
}

export function useFusionMixSwap(amountIn: CurrencyAmount | undefined, update: boolean, confirm: boolean) {
  const [result, setResult] = useState<
    | {
        tokenIn?: Token
        tokenOut?: Token
        result?: CurrencyAmount
        amounts?: CurrencyAmount[]
      }
    | undefined
  >()
  const [loading, setLoading] = useState<boolean>(false)

  const {
    swapMode,
    typedValue,
    [Field.INPUT]: { currencyId: tokenIn },
    [Field.OUTPUT]: { currencyId: tokenOut }
  } = useSwapState()

  useEffect(() => {
    if (!confirm) setResult(undefined)

    const getFusionMixSwap = async () => {
      setLoading(true)
      if (tokenIn && tokenOut && parseFloat(typedValue) > 0 && amountIn && swapMode === 1) {
        try {
          const data = await axios.post('http://localhost:8001/api/swap/mixswap', {
            addressIn: tokenIn === 'ETH' ? WETH[42170].address : tokenIn,
            addressOut: tokenOut === 'ETH' ? WETH[42170].address : tokenOut,
            amountIn: amountIn.raw.toString()
          })
          if (data.status === 200 && data.data) {
            const tokenIn = data.data.tokenIn
              ? new Token(
                  data.data.tokenIn.chainId,
                  data.data.tokenIn.address,
                  data.data.tokenIn.decimals,
                  data.data.tokenIn.symbol,
                  data.data.tokenIn.name
                )
              : undefined
            const tokenOut = data.data.tokenOut
              ? new Token(
                  data.data.tokenOut.chainId,
                  data.data.tokenOut.address,
                  data.data.tokenOut.decimals,
                  data.data.tokenOut.symbol,
                  data.data.tokenOut.name
                )
              : undefined
            const resultAmount = data.data.result && tokenOut ? new TokenAmount(tokenOut, data.data.result) : undefined
            const amounts: CurrencyAmount[] | undefined =
              data.data.amounts && tokenIn
                ? data.data.amounts.map((amount: any) => new TokenAmount(tokenIn, amount))
                : undefined

            setResult({
              tokenIn,
              tokenOut,
              result: resultAmount,
              amounts
            })
          } else {
            setResult(undefined)
          }
        } catch (err) {
          console.log(err)
          throw new Error(JSON.stringify(err))
        }
      }
      setLoading(false)
    }

    if (update) getFusionMixSwap()
  }, [tokenIn, tokenOut, typedValue, swapMode, update])

  return { result, loading }
}

export function useFusionTimer(swapConfirm: boolean) {
  const {
    swapMode,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId }
  } = useSwapState()

  const [update, setUpdate] = useState<boolean>(false)

  useEffect(() => {
    setUpdate(false)
    if (swapMode === 0) {
      setUpdate(false)
    } else {
      const inputTimer = (setTimeout(
        () => {
          setUpdate(true)
        },
        swapConfirm ? 0 : 2000
      ) as unknown) as number

      const autoTimer = (setInterval(() => {
        setUpdate(true)
      }, 30000) as unknown) as number

      return () => {
        clearTimeout(inputTimer)
        clearInterval(autoTimer)
      }
    }
  }, [inputCurrencyId, outputCurrencyId, typedValue, swapMode, swapConfirm])

  return update
}
