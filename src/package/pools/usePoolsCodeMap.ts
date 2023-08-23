import { useQuery } from '@tanstack/react-query'
import { ChainId } from 'package/chain'
import { Type } from 'package/currency'
import { DataFetcher } from 'package/router'
import { PoolCode } from 'package/router/pools/PoolCode'

const getPoolsCodeMap = async (currencyA: Type | undefined, currencyB: Type | undefined) => {
  if (!currencyA || !currencyB) return new Map<string, PoolCode>()

  const dataFetcher = DataFetcher.onChain(ChainId.ARBITRUM_NOVA)
  dataFetcher.startDataFetching()
  await dataFetcher.fetchPoolsForToken(currencyA, currencyB)
  dataFetcher.stopDataFetching()
  return dataFetcher.getCurrentPoolCodeMap(currencyA, currencyB)
}

export function usePoolsCodeMap(currencyA: Type | undefined, currencyB: Type | undefined,) {
  return useQuery({
    queryKey: ['usePoolsCodeMap', currencyA, currencyB],
    queryFn: async () => await getPoolsCodeMap(currencyA, currencyB),
    refetchInterval: 10000
  })
}
