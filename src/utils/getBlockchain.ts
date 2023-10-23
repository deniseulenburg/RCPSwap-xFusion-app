import { Blockchain, ChainId } from '@rcpswap/sdk'

export default function getBlockchain(chainId: ChainId | undefined): Blockchain {
  switch (chainId) {
    case ChainId.MAINNET:
    case ChainId.ROPSTEN:
    case ChainId.RINKEBY:
    case ChainId.GÖRLI:
    case ChainId.KOVAN:
      return Blockchain.ETHEREUM
    case ChainId.BSC_MAINNET:
    case ChainId.BSC_TESTNET:
      return Blockchain.BINANCE_SMART_CHAIN
    case ChainId.POLYGON:
      return Blockchain.POLYGON
    case ChainId.ARBITRUM_NOVA:
      return Blockchain.NOVA
    default:
      return Blockchain.ETHEREUM
  }
}
