import { ChainConstructor, ChainId, Icons } from '../constants'

export interface NativeCurrency {
    name: string
    symbol: string
    decimals: number
}

export class Chain {
    public readonly id: ChainId
    public readonly name: string
    public readonly disabled: boolean
    public readonly swappable: boolean
    public readonly evm: boolean
    public readonly explorer: string
    public readonly icons: Icons
    public readonly nativeCurrency?: NativeCurrency

    constructor(params: ChainConstructor) {
        this.id = params.id
        this.name = params.name
        this.disabled = params.disabled
        this.explorer = params.explorer
        this.icons = params.icons
        this.swappable = params?.swappable !== false
        this.evm = params?.evm !== false
        this.nativeCurrency = params.nativeCurrency
    }
}

export const chains: Chain[] = [
    new Chain({
        id: ChainId.BTC_MAINNET,
        name: 'Bitcoin',
        disabled: false,
        explorer: 'https://www.blockchain.com/btc',
        icons: {
            small: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
            large: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
        },
        evm: false,
    }),
    new Chain({
        id: ChainId.BTC_TESTNET,
        name: 'Bitcoin',
        disabled: false,
        explorer: 'https://www.blockchain.com/btc-testnet',
        icons: {
            small: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
            large: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
        },
        evm: false,
    }),
    new Chain({
        id: ChainId.ETH_MAINNET,
        name: 'Ethereum',
        disabled: false,
        explorer: 'https://etherscan.io',
        icons: {
            small: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
            large: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
        },
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.ETH_RINKEBY,
        name: 'Rinkeby',
        disabled: false,
        explorer: 'https://rinkeby.etherscan.io',
        icons: {
            small: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
            large: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
        },
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.ETH_GOERLI,
        name: 'Goerli',
        disabled: false,
        explorer: 'https://goerli.etherscan.io',
        icons: {
            small: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
            large: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
        },
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.ETH_KOVAN,
        name: 'Kovan',
        disabled: false,
        explorer: 'https://kovan.etherscan.io',
        icons: {
            small: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
            large: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
        },
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.BSC_MAINNET,
        name: 'BNB',
        disabled: false,
        explorer: 'https://bscscan.com',
        icons: {
            small: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
            large: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
        },
        nativeCurrency: {
            name: 'BNB Chain Native Token',
            symbol: 'BNB',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.BSC_TESTNET,
        name: 'BNB',
        disabled: false,
        explorer: 'https://testnet.bscscan.com',
        icons: {
            small: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
            large: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
        },
        nativeCurrency: {
            name: 'BNB Chain Native Token',
            symbol: 'tBNB',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.MATIC_MAINNET,
        name: 'Polygon',
        disabled: false,
        explorer: 'https://polygonscan.com',
        icons: {
            small: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
            large: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
        },
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.MATIC_MUMBAI,
        name: 'Mumbai', // Polygon Testnet
        disabled: false,
        explorer: 'https://mumbai.polygonscan.com',
        icons: {
            small: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
            large: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
        },
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.AVAX_MAINNET,
        name: 'Avalanche',
        disabled: false,
        explorer: 'https://snowtrace.io',
        icons: {
            small: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchex/info/logo.png',
            large: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchex/info/logo.png',
        },
        nativeCurrency: {
            name: 'Avalanche',
            symbol: 'AVAX',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.AVAX_TESTNET,
        name: 'Fuji',
        disabled: false,
        explorer: 'https://testnet.snowtrace.io',
        icons: {
            small: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchex/info/logo.png',
            large: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchex/info/logo.png',
        },
        nativeCurrency: {
            name: 'Avalanche',
            symbol: 'AVAX',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.HECO_MAINNET,
        name: 'HECO',
        disabled: false,
        explorer: 'https://hecoinfo.com',
        icons: {
            small: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/heco/info/logo.png',
            large: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/heco/info/logo.png',
        },
        nativeCurrency: {
            name: 'Huobi ECO Chain Native Token',
            symbol: 'HT',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.HECO_TESTNET,
        name: 'HECO',
        disabled: false,
        explorer: 'https://testnet.hecoinfo.com',
        icons: {
            small: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/heco/info/logo.png',
            large: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/heco/info/logo.png',
        },
        nativeCurrency: {
            name: 'Huobi ECO Chain Native Token',
            symbol: 'HT',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.OKEX_MAINNET,
        name: 'OEC',
        disabled: false,
        explorer: 'https://www.oklink.com/oec',
        icons: {
            small: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/294.png',
            large: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/294.png',
        },
        nativeCurrency: {
            name: 'OKExChain Global Utility Token in testnet',
            symbol: 'OKT',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.OKEX_TESTNET,
        name: 'OEC',
        disabled: false,
        explorer: 'https://www.oklink.com/oec-test',
        icons: {
            small: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/294.png',
            large: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/294.png',
        },
        nativeCurrency: {
            name: 'OKExChain Global Utility Token in testnet',
            symbol: 'OKT',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.BOBA_MAINNET,
        name: 'Boba Ethereum',
        disabled: false,
        explorer: 'https://blockexplorer.boba.network',
        icons: {
            small: 'https://raw.githubusercontent.com/allush/assets/main/images/blockchains/boba-ethereum/logo.png',
            large: 'https://raw.githubusercontent.com/allush/assets/main/images/blockchains/boba-ethereum/logo.png',
        },
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.BOBA_RINKEBY,
        name: 'Boba Rinkeby',
        disabled: false,
        explorer: 'https://blockexplorer.rinkeby.boba.network',
        icons: {
            small: 'https://raw.githubusercontent.com/allush/assets/main/images/blockchains/boba-ethereum/logo.png',
            large: 'https://raw.githubusercontent.com/allush/assets/main/images/blockchains/boba-ethereum/logo.png',
        },
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.BOBA_AVALANCHE,
        name: 'Boba Avalanche',
        disabled: false,
        explorer: 'https://blockexplorer.avax.boba.network',
        icons: {
            small: 'https://raw.githubusercontent.com/allush/assets/main/images/blockchains/boba-avalanche/logo.png',
            large: 'https://raw.githubusercontent.com/allush/assets/main/images/blockchains/boba-avalanche/logo.png',
        },
        nativeCurrency: {
            name: 'Boba Token',
            symbol: 'BOBA',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.BOBA_BNB,
        name: 'Boba BNB',
        disabled: false,
        explorer: 'https://blockexplorer.bnb.boba.network',
        icons: {
            small: 'https://raw.githubusercontent.com/allush/assets/main/images/blockchains/boba-bnb/logo.png',
            large: 'https://raw.githubusercontent.com/allush/assets/main/images/blockchains/boba-bnb/logo.png',
        },
        nativeCurrency: {
            name: 'Boba Token',
            symbol: 'BOBA',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.MILKOMEDA_MAINNET,
        name: 'Milkomeda',
        disabled: false,
        explorer: 'https://explorer-mainnet-cardano-evm.c1.milkomeda.com',
        icons: {
            small: 'https://raw.githubusercontent.com/allush/assets/main/images/blockchains/milkomeda/logo.png',
            large: 'https://raw.githubusercontent.com/allush/assets/main/images/blockchains/milkomeda/logo.png',
        },
    }),
    new Chain({
        id: ChainId.MILKOMEDA_DEVNET,
        name: 'Milkomeda',
        disabled: false,
        explorer: 'https://explorer-devnet-cardano-evm.c1.milkomeda.com',
        icons: {
            small: 'https://raw.githubusercontent.com/allush/assets/main/images/blockchains/milkomeda/logo.png',
            large: 'https://raw.githubusercontent.com/allush/assets/main/images/blockchains/milkomeda/logo.png',
        },
    }),
    new Chain({
        id: ChainId.AURORA_MAINNET,
        name: 'Aurora',
        disabled: false,
        explorer: 'https://aurorascan.dev',
        icons: {
            small: 'https://s2.coinmarketcap.com/static/img/coins/64x64/14803.png',
            large: 'https://s2.coinmarketcap.com/static/img/coins/64x64/14803.png',
        },
    }),
    new Chain({
        id: ChainId.AURORA_TESTNET,
        name: 'Aurora',
        disabled: false,
        explorer: 'https://testnet.aurorascan.dev',
        icons: {
            small: 'https://s2.coinmarketcap.com/static/img/coins/64x64/14803.png',
            large: 'https://s2.coinmarketcap.com/static/img/coins/64x64/14803.png',
        },
    }),
    new Chain({
        id: ChainId.TELOS_MAINNET,
        name: 'Telos',
        disabled: false,
        explorer: 'https://teloscan.io',
        icons: {
            small: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4660.png',
            large: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4660.png',
        },
        nativeCurrency: {
            name: 'Telos',
            symbol: 'TLOS',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.TELOS_TESTNET,
        name: 'Telos',
        disabled: false,
        explorer: 'https://testnet.teloscan.io',
        icons: {
            small: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4660.png',
            large: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4660.png',
        },
        nativeCurrency: {
            name: 'Telos',
            symbol: 'TLOS',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.SHARDEUM_TESTNET_2,
        name: 'Shardeum Liberty 2.X',
        disabled: false,
        explorer: 'https://explorer-liberty20.shardeum.org',
        icons: {
            small: 'https://s2.coinmarketcap.com/static/img/coins/64x64/22353.png',
            large: 'https://s2.coinmarketcap.com/static/img/coins/64x64/22353.png',
        },
    }),
    new Chain({
        id: ChainId.KAVA_MAINNET,
        name: 'KAVA EVM',
        disabled: false,
        explorer: 'https://explorer.kava.io',
        icons: {
            small: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4846.png',
            large: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4846.png',
        },
        nativeCurrency: {
            name: 'Kava',
            symbol: 'KAVA',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.SCROLL_TESTNET,
        name: 'Scroll Alpha',
        disabled: false,
        explorer: 'https://blockscout.scroll.io',
        icons: {
            small: 'https://res.cloudinary.com/dzkjyvmsn/image/upload/v1680688496/scroll_p8h6bl.png',
            large: 'https://res.cloudinary.com/dzkjyvmsn/image/upload/v1680688496/scroll_p8h6bl.png',
        },
    }),
    new Chain({
        id: ChainId.SCROLL_SEPOLIA,
        name: 'Scroll Sepolia',
        disabled: false,
        explorer: 'https://sepolia-blockscout.scroll.io',
        icons: {
            small: 'https://res.cloudinary.com/dzkjyvmsn/image/upload/v1680688496/scroll_p8h6bl.png',
            large: 'https://res.cloudinary.com/dzkjyvmsn/image/upload/v1680688496/scroll_p8h6bl.png',
        },
    }),
    new Chain({
        id: ChainId.ZKSYNC_MAINNET,
        name: 'ZkSync Era',
        disabled: false,
        explorer: 'https://explorer.zksync.io',
        icons: {
            small: 'https://s2.coinmarketcap.com/static/img/coins/64x64/24091.png',
            large: 'https://s2.coinmarketcap.com/static/img/coins/64x64/24091.png',
        },
    }),
    new Chain({
        id: ChainId.ARBITRUM_MAINNET,
        name: 'Arbitrum One',
        disabled: false,
        explorer: 'https://arbiscan.io',
        icons: {
            small: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png',
            large: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png',
        },
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.ARBITRUM_NOVA,
        name: 'Arbitrum Nova',
        disabled: false,
        explorer: 'https://nova.arbiscan.io',
        icons: {
            small: 'https://l2beat.com/icons/nova.png',
            large: 'https://l2beat.com/icons/nova.png',
        },
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.OPTIMISM_MAINNET,
        name: 'Optimism',
        disabled: false,
        explorer: 'https://optimistic.etherscan.io',
        icons: {
            small: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11840.png',
            large: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11840.png',
        },
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.ZETACHAIN_ATHENS_2,
        name: 'ZetaChain',
        disabled: false,
        explorer: 'https://explorer.zetachain.com',
        icons: {
            small: 'https://s2.coinmarketcap.com/static/img/coins/64x64/21259.png',
            large: 'https://s2.coinmarketcap.com/static/img/coins/64x64/21259.png',
        },
    }),
    new Chain({
        id: ChainId.POLYGON_ZK,
        name: 'Polygon zkEVM',
        disabled: false,
        explorer: 'https://zkevm.polygonscan.com',
        icons: {
            small: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png',
            large: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png',
        },
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
    }),
    new Chain({
        id: ChainId.TRON_MAINNET,
        name: 'Tron',
        disabled: false,
        explorer: 'https://tronscan.org',
        icons: {
            small: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png',
            large: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png',
        },
        evm: false,
    }),
    new Chain({
        id: ChainId.TRON_TESTNET,
        name: 'Tron Testnet',
        disabled: false,
        explorer: 'https://shasta.tronscan.org',
        icons: {
            small: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png',
            large: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png',
        },
        evm: false,
    }),
    new Chain({
        id: ChainId.LINEA_TESTNET,
        name: 'Linea',
        disabled: false,
        explorer: 'https://goerli.lineascan.build',
        icons: {
            small: 'https://l2beat.com/icons/linea.png',
            large: 'https://l2beat.com/icons/linea.png',
        },
    }),
    new Chain({
        id: ChainId.LINEA_MAINNET,
        name: 'Linea',
        disabled: false,
        explorer: 'https://lineascan.build',
        icons: {
            small: 'https://l2beat.com/icons/linea.png',
            large: 'https://l2beat.com/icons/linea.png',
        },
    }),
    new Chain({
        id: ChainId.MANTLE_MAINNET,
        name: 'Mantle',
        disabled: false,
        explorer: 'https://explorer.mantle.xyz',
        icons: {
            small: 'https://s2.coinmarketcap.com/static/img/coins/64x64/27075.png',
            large: 'https://s2.coinmarketcap.com/static/img/coins/64x64/27075.png',
        },
    }),
    new Chain({
        id: ChainId.MANTLE_TESTNET,
        name: 'Mantle',
        disabled: false,
        explorer: 'https://explorer.testnet.mantle.xyz',
        icons: {
            small: 'https://s2.coinmarketcap.com/static/img/coins/64x64/27075.png',
            large: 'https://s2.coinmarketcap.com/static/img/coins/64x64/27075.png',
        },
    }),
    new Chain({
        id: ChainId.BASE_MAINNET,
        name: 'Base',
        disabled: false,
        explorer: 'https://basescan.org',
        icons: {
            small: 'https://raw.githubusercontent.com/allush/assets/main/images/blockchains/base/logo.png',
            large: 'https://raw.githubusercontent.com/allush/assets/main/images/blockchains/base/logo.png',
        },
    }),
    new Chain({
        id: ChainId.SCROLL_MAINNET,
        name: 'Scroll',
        disabled: false,
        explorer: 'https://scrollscan.com',
        icons: {
            small: 'https://res.cloudinary.com/dzkjyvmsn/image/upload/v1680688496/scroll_p8h6bl.png',
            large: 'https://res.cloudinary.com/dzkjyvmsn/image/upload/v1680688496/scroll_p8h6bl.png',
        },
    }),
]

export const getChainById = (chainId: ChainId | undefined): Chain | undefined => {
    if (!chainId) return undefined
    return chains.find((chain) => chain.id === chainId)
}
