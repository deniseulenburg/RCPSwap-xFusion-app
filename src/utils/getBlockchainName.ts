import { ChainId } from '@rcpswap/sdk'

export default function getBlockchainName(chainId: ChainId | undefined): string {
  switch (chainId) {
    case ChainId.MAINNET:
    case ChainId.ROPSTEN:
    case ChainId.RINKEBY:
    case ChainId.GÖRLI:
    case ChainId.KOVAN:
      return 'Ethereum'
    case ChainId.BSC_MAINNET:
    case ChainId.BSC_TESTNET:
      return 'Binance Smart Chain'
    case ChainId.ARBITRUM_NOVA:
    case ChainId.HARMONY_TESTNET:
      return 'Arbitrum Nova'
    default:
      return 'Ethereum'
  }
}
