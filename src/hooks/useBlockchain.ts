import { Blockchain, ChainId } from '@rcpswap/sdk'
import getBlockchain from '../utils/getBlockchain'
import { useActiveWeb3React } from './index'

export default function useBlockchain(chainId?: ChainId): Blockchain {
  return getBlockchain(chainId ?? ChainId.ARBITRUM_NOVA)
}
