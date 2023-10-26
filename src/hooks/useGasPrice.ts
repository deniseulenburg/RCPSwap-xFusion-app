import { ChainId } from '@rcpswap/sdk'
import { useQuery } from '@tanstack/react-query'
import { useBlockNumber } from 'state/application/hooks'
import { getProvider } from 'utils'

export function useGasPrice(chainId?: ChainId) {
  const blockNumber = useBlockNumber(chainId)
  const provider = getProvider(chainId)

  const { data: gasPrice } = useQuery({
    queryKey: ['useGasPrice', blockNumber],
    queryFn: async () => parseInt((await provider?.getGasPrice())?.toString() ?? '10000000')
  })

  return gasPrice
}
