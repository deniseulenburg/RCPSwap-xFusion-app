import { BigNumber } from 'ethers'
import { useSingleCallResult } from '../state/multicall/hooks'
import { useMulticallContract } from './useContract'
import { ChainId } from '@rcpswap/sdk'

// gets the current timestamp from the blockchain
export default function useCurrentBlockTimestamp(): BigNumber | undefined {
  const multicall = useMulticallContract()
  return useSingleCallResult(multicall, 'getCurrentBlockTimestamp', undefined, ChainId.ARBITRUM_NOVA)?.result?.[0]
}
