import { ChainId } from '../../chain'
// import { PrismaClient } from "@prisma/client";
import { PublicClient } from 'viem'

import { LiquidityProviders } from './LiquidityProvider'
import { UniswapV2BaseProvider } from './UniswapV2Base'

export class RCPSwapProvider extends UniswapV2BaseProvider {
  constructor(
    chainId: ChainId,
    web3Client: PublicClient
    // databaseClient?: PrismaClient
  ) {
    const factory = {
      [ChainId.ARBITRUM_NOVA]: '0xF9901551B4fDb1FE8d5617B5deB6074Bb8E1F6FB'
    } as const

    const initCodeHash = {
      [ChainId.ARBITRUM_NOVA]: '0x8455b0f8e468580a0ae3f8afe8b676f72e1a9d93425122526501153d3647ea6f'
    } as const

    super(chainId, web3Client, factory, initCodeHash)
  }
  getType(): LiquidityProviders {
    return LiquidityProviders.RCPSwap
  }
  getPoolProviderName(): string {
    return 'RCPSwap'
  }
}
