import { ChainId } from '../../chain'

import { addressMapToTokenMap } from '../addressMapToTokenMap'
import { Token } from '../Token'
import {
  ARB_ADDRESS,
  BRICK_ADDRESS,
  DAI_ADDRESS,
  MOON_ADDRESS,
  SUSHI_ADDRESS,
  USDC_ADDRESS,
  USDT_ADDRESS,
  WBTC_ADDRESS,
  WETH9_ADDRESS,
  WNATIVE_ADDRESS
} from './token-addresses'

export const ARB = addressMapToTokenMap(
  {
    decimals: 18,
    symbol: 'ARB',
    name: 'Arbitrum'
  },
  ARB_ADDRESS
) as Record<keyof typeof ARB_ADDRESS, Token>

export const WBTC = addressMapToTokenMap(
  {
    decimals: 8,
    symbol: 'WBTC',
    name: 'Wrapped BTC'
  },
  WBTC_ADDRESS
) as Record<keyof typeof WBTC_ADDRESS, Token>

export const WETH9 = addressMapToTokenMap(
  {
    decimals: 18,
    symbol: 'WETH',
    name: 'Wrapped Ether'
  },
  WETH9_ADDRESS
) as Record<keyof typeof WETH9_ADDRESS, Token>

export const WNATIVE = {
  [ChainId.ETHEREUM]: WETH9[ChainId.ETHEREUM],
  [ChainId.ROPSTEN]: WETH9[ChainId.ROPSTEN],
  [ChainId.RINKEBY]: WETH9[ChainId.RINKEBY],
  [ChainId.GÖRLI]: WETH9[ChainId.GÖRLI],
  [ChainId.KOVAN]: WETH9[ChainId.KOVAN],
  [ChainId.OPTIMISM]: WETH9[ChainId.OPTIMISM],
  [ChainId.FANTOM]: new Token({
    chainId: ChainId.FANTOM,
    address: WNATIVE_ADDRESS[ChainId.FANTOM],
    decimals: 18,
    symbol: 'WFTM',
    name: 'Wrapped FTM'
  }),
  [ChainId.FANTOM_TESTNET]: new Token({
    chainId: ChainId.FANTOM_TESTNET,
    address: WNATIVE_ADDRESS[ChainId.FANTOM_TESTNET],
    decimals: 18,
    symbol: 'WFTM',
    name: 'Wrapped FTM'
  }),
  [ChainId.POLYGON]: new Token({
    chainId: ChainId.POLYGON,
    address: WNATIVE_ADDRESS[ChainId.POLYGON],
    decimals: 18,
    symbol: 'WMATIC',
    name: 'Wrapped Matic'
  }),
  [ChainId.POLYGON_TESTNET]: new Token({
    chainId: ChainId.POLYGON_TESTNET,
    address: WNATIVE_ADDRESS[ChainId.POLYGON_TESTNET],
    decimals: 18,
    symbol: 'WMATIC',
    name: 'Wrapped Matic'
  }),
  [ChainId.GNOSIS]: new Token({
    chainId: ChainId.GNOSIS,
    address: WNATIVE_ADDRESS[ChainId.GNOSIS],
    decimals: 18,
    symbol: 'WXDAI',
    name: 'Wrapped xDai'
  }),
  [ChainId.BSC]: new Token({
    chainId: ChainId.BSC,
    address: WNATIVE_ADDRESS[ChainId.BSC],
    decimals: 18,
    symbol: 'WBNB',
    name: 'Wrapped BNB'
  }),
  [ChainId.BSC_TESTNET]: new Token({
    chainId: ChainId.BSC_TESTNET,
    address: WNATIVE_ADDRESS[ChainId.BSC_TESTNET],
    decimals: 18,
    symbol: 'WBNB',
    name: 'Wrapped BNB'
  }),
  [ChainId.ARBITRUM]: WETH9[ChainId.ARBITRUM],
  [ChainId.ARBITRUM_TESTNET]: WETH9[ChainId.ARBITRUM_TESTNET],
  [ChainId.ARBITRUM_NOVA]: WETH9[ChainId.ARBITRUM_NOVA],
  [ChainId.AVALANCHE]: new Token({
    chainId: ChainId.AVALANCHE,
    address: WNATIVE_ADDRESS[ChainId.AVALANCHE],
    decimals: 18,
    symbol: 'WAVAX',
    name: 'Wrapped AVAX'
  }),
  [ChainId.AVALANCHE_TESTNET]: new Token({
    chainId: ChainId.AVALANCHE_TESTNET,
    address: WNATIVE_ADDRESS[ChainId.AVALANCHE_TESTNET],
    decimals: 18,
    symbol: 'WAVAX',
    name: 'Wrapped AVAX'
  }),
  [ChainId.HECO]: new Token({
    chainId: ChainId.HECO,
    address: WNATIVE_ADDRESS[ChainId.HECO],
    decimals: 18,
    symbol: 'WHT',
    name: 'Wrapped HT'
  }),
  [ChainId.HECO_TESTNET]: new Token({
    chainId: ChainId.HECO_TESTNET,
    address: WNATIVE_ADDRESS[ChainId.HECO_TESTNET],
    decimals: 18,
    symbol: 'WHT',
    name: 'Wrapped HT'
  }),
  [ChainId.HARMONY]: new Token({
    chainId: ChainId.HARMONY,
    address: WNATIVE_ADDRESS[ChainId.HARMONY],
    decimals: 18,
    symbol: 'WONE',
    name: 'Wrapped ONE'
  }),
  [ChainId.HARMONY_TESTNET]: new Token({
    chainId: ChainId.HARMONY_TESTNET,
    address: WNATIVE_ADDRESS[ChainId.HARMONY_TESTNET],
    decimals: 18,
    symbol: 'WONE',
    name: 'Wrapped ONE'
  }),
  [ChainId.OKEX]: new Token({
    chainId: ChainId.OKEX,
    address: WNATIVE_ADDRESS[ChainId.OKEX],
    decimals: 18,
    symbol: 'WOKT',
    name: 'Wrapped OKExChain'
  }),
  [ChainId.OKEX_TESTNET]: new Token({
    chainId: ChainId.OKEX_TESTNET,
    address: WNATIVE_ADDRESS[ChainId.OKEX_TESTNET],
    decimals: 18,
    symbol: 'WOKT',
    name: 'Wrapped OKExChain'
  }),
  [ChainId.CELO]: new Token({
    chainId: ChainId.CELO,
    address: WNATIVE_ADDRESS[ChainId.CELO],
    decimals: 18,
    symbol: 'CELO',
    name: 'Celo'
  }),
  [ChainId.PALM]: new Token({
    chainId: ChainId.PALM,
    address: WNATIVE_ADDRESS[ChainId.PALM],
    decimals: 18,
    symbol: 'WPALM',
    name: 'Wrapped Palm'
  }),
  [ChainId.MOONRIVER]: new Token({
    chainId: ChainId.MOONRIVER,
    address: WNATIVE_ADDRESS[ChainId.MOONRIVER],
    decimals: 18,
    symbol: 'WMOVR',
    name: 'Wrapped Moonriver'
  }),
  [ChainId.FUSE]: new Token({
    chainId: ChainId.FUSE,
    address: WNATIVE_ADDRESS[ChainId.FUSE],
    decimals: 18,
    symbol: 'WFUSE',
    name: 'Wrapped Fuse'
  }),
  [ChainId.TELOS]: new Token({
    chainId: ChainId.TELOS,
    address: WNATIVE_ADDRESS[ChainId.TELOS],
    decimals: 18,
    symbol: 'WTLOS',
    name: 'Wrapped Telos'
  }),
  [ChainId.MOONBEAM]: new Token({
    chainId: ChainId.MOONBEAM,
    address: WNATIVE_ADDRESS[ChainId.MOONBEAM],
    decimals: 18,
    symbol: 'WGLMR',
    name: 'Wrapped Glimmer'
  }),
  [ChainId.KAVA]: new Token({
    chainId: ChainId.KAVA,
    address: WNATIVE_ADDRESS[ChainId.KAVA],
    decimals: 18,
    symbol: 'WKAVA',
    name: 'Wrapped Kava'
  }),
  [ChainId.METIS]: new Token({
    chainId: ChainId.METIS,
    address: WNATIVE_ADDRESS[ChainId.METIS],
    decimals: 18,
    symbol: 'WMETIS',
    name: 'Wrapped Metis'
  }),
  [ChainId.BOBA]: WETH9[ChainId.BOBA],
  [ChainId.BOBA_AVAX]: new Token({
    chainId: ChainId.BOBA_AVAX,
    address: WNATIVE_ADDRESS[ChainId.BOBA_AVAX],
    decimals: 18,
    symbol: 'WBOBA',
    name: 'Wrapped Boba'
  }),
  [ChainId.BOBA_BNB]: new Token({
    chainId: ChainId.BOBA_BNB,
    address: WNATIVE_ADDRESS[ChainId.BOBA_BNB],
    decimals: 18,
    symbol: 'WBOBA',
    name: 'Wrapped Boba'
  }),
  [ChainId.BTTC]: new Token({
    chainId: ChainId.BTTC,
    address: WNATIVE_ADDRESS[ChainId.BTTC],
    decimals: 18,
    symbol: 'WBTT',
    name: 'Wrapped BitTorrent Token'
  }),
  // [ChainId.SEPOLIA]: WETH9[ChainId.SEPOLIA],
  // [ChainId.CONSENSUS_ZKEVM_TESTNET]: WETH9[ChainId.CONSENSUS_ZKEVM_TESTNET],
  // [ChainId.SCROLL_ALPHA_TESTNET]: WETH9[ChainId.SCROLL_ALPHA_TESTNET],
  // [ChainId.BASE_TESTNET]: WETH9[ChainId.BASE_TESTNET],
  [ChainId.THUNDERCORE]: new Token({
    chainId: ChainId.THUNDERCORE,
    address: WNATIVE_ADDRESS[ChainId.THUNDERCORE],
    decimals: 18,
    symbol: 'WTT',
    name: 'Wrapped Thunder Token'
  }),
  [ChainId.POLYGON_ZKEVM]: WETH9[ChainId.POLYGON_ZKEVM]
} as const

export const SUSHI = addressMapToTokenMap(
  {
    decimals: 18,
    symbol: 'SUSHI',
    name: 'SushiToken'
  },
  SUSHI_ADDRESS
) as Record<keyof typeof SUSHI_ADDRESS, Token>

export const USDC: Record<keyof typeof USDC_ADDRESS, Token> = {
  ...(addressMapToTokenMap(
    {
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin'
    },
    USDC_ADDRESS
  ) as Omit<Record<keyof typeof USDC_ADDRESS, Token>, typeof ChainId.BSC & typeof ChainId.BSC_TESTNET>),
  [ChainId.BSC]: new Token({
    chainId: ChainId.BSC,
    address: USDC_ADDRESS[ChainId.BSC],
    decimals: 18,
    symbol: 'USDC',
    name: 'USD Coin'
  }),
  [ChainId.BOBA_BNB]: new Token({
    chainId: ChainId.BOBA_BNB,
    address: USDC_ADDRESS[ChainId.BOBA_BNB],
    decimals: 18,
    symbol: 'USDC',
    name: 'USD Coin'
  })
} as const

export const USDT: Record<keyof typeof USDT_ADDRESS, Token> = {
  ...(addressMapToTokenMap(
    {
      decimals: 6,
      symbol: 'USDT',
      name: 'Tether USD'
    },
    USDT_ADDRESS
  ) as Omit<Record<keyof typeof USDT_ADDRESS, Token>, typeof ChainId.BSC & typeof ChainId.BSC_TESTNET>),
  [ChainId.BSC]: new Token({
    chainId: ChainId.BSC,
    address: USDT_ADDRESS[ChainId.BSC],
    decimals: 18,
    symbol: 'USDT',
    name: 'Tether USD'
  }),
  [ChainId.BSC_TESTNET]: new Token({
    chainId: ChainId.BSC_TESTNET,
    address: USDT_ADDRESS[ChainId.BSC_TESTNET],
    decimals: 18,
    symbol: 'USDT',
    name: 'Tether USD'
  }),
  [ChainId.BOBA_BNB]: new Token({
    chainId: ChainId.BOBA_BNB,
    address: USDT_ADDRESS[ChainId.BOBA_BNB],
    decimals: 18,
    symbol: 'USDT',
    name: 'Tether USD'
  })
}

export const MOON: Record<keyof typeof MOON_ADDRESS, Token> = {
  [ChainId.ARBITRUM_NOVA]: new Token({
    chainId: ChainId.ARBITRUM_NOVA,
    address: MOON_ADDRESS[ChainId.ARBITRUM_NOVA],
    decimals: 18,
    symbol: 'MOON',
    name: 'Moons'
  })
}

export const BRICK: Record<keyof typeof BRICK_ADDRESS, Token> = {
  [ChainId.ARBITRUM_NOVA]: new Token({
    chainId: ChainId.ARBITRUM_NOVA,
    address: BRICK_ADDRESS[ChainId.ARBITRUM_NOVA],
    decimals: 18,
    symbol: 'BRICK',
    name: 'Bricks'
  })
}

export const DAI = addressMapToTokenMap(
  {
    decimals: 18,
    symbol: 'DAI',
    name: 'Dai Stablecoin'
  },
  DAI_ADDRESS
) as Record<keyof typeof DAI_ADDRESS, Token>
