import { Blockchain } from '@rcpswap/sdk'

// Returns the block time in seconds
export default function getBlockchainBlockTime(blockchain: Blockchain): number {
  switch (blockchain) {
    case Blockchain.BINANCE_SMART_CHAIN:
      return 3
    case Blockchain.NOVA:
      return 2
    case Blockchain.POLYGON:
      return 2
    default:
      return 13
  }
}
