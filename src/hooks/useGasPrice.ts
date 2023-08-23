import { useQuery } from '@tanstack/react-query'
import { useActiveWeb3React } from 'hooks'
import { useEffect, useState } from 'react'
import { useBlockNumber } from 'state/application/hooks'

export function useGasPrice() {
  const { library } = useActiveWeb3React()
  const blockNumber = useBlockNumber()

  const {data: gasPrice} = useQuery({
    queryKey: ['useGasPrice', blockNumber],
    queryFn: async () => parseInt((await library?.getGasPrice())?.toString() ?? '10000000')
  })

  return gasPrice
}
