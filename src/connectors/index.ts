import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { PortisConnector } from '@web3-react/portis-connector'

import { FortmaticConnector } from './Fortmatic'
import { NetworkConnector } from './NetworkConnector'

import { Blockchain, ChainId, Currency } from '@rcpswap/sdk'

import baseCurrencies from '../utils/baseCurrencies'
import getBlockchain from '../utils/getBlockchain'

export const NETWORK_URL = process.env.REACT_APP_NETWORK_URL
export const NETWORK_CHAIN_ID: number = parseInt(process.env.REACT_APP_CHAIN_ID ?? '42170')

const FORMATIC_KEY = process.env.REACT_APP_FORTMATIC_KEY
const PORTIS_ID = process.env.REACT_APP_PORTIS_ID

if (typeof NETWORK_URL === 'undefined') {
  throw new Error(`REACT_APP_NETWORK_URL must be a defined environment variable`)
}

export const network = new NetworkConnector({
  urls: {
    [ChainId.POLYGON]: 'https://polygon.llamarpc.com',
    [ChainId.ARBITRUM_NOVA]: 'https://nova.arbitrum.io/rpc'
  },
  defaultChainId: ChainId.ARBITRUM_NOVA
})

const generatedBaseCurrencies = baseCurrencies(NETWORK_CHAIN_ID)
export const BASE_CURRENCY: Currency = generatedBaseCurrencies[0]
export const BASE_WRAPPED_CURRENCY: Currency = generatedBaseCurrencies[1]

export const BLOCKCHAIN: Blockchain = getBlockchain(NETWORK_CHAIN_ID)

let networkLibrary: Web3Provider | undefined
export function getNetworkLibrary(): Web3Provider {
  return (networkLibrary = networkLibrary ?? new Web3Provider(network.provider as any))
}

const supportedChainIds: number[] = [ChainId.ARBITRUM_NOVA, ChainId.POLYGON]

export const injected = new InjectedConnector({
  supportedChainIds: supportedChainIds
})

// mainnet only
export const walletconnect = new WalletConnectConnector({
  rpc: { 1: NETWORK_URL },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: 15000
})

// mainnet only
export const fortmatic = new FortmaticConnector({
  apiKey: FORMATIC_KEY ?? '',
  chainId: 1
})

// mainnet only
export const portis = new PortisConnector({
  dAppId: PORTIS_ID ?? '',
  networks: [1]
})

// mainnet only
export const walletlink = new WalletLinkConnector({
  url: NETWORK_URL,
  appName: 'RCPSwap | Reddit Community Points Swap',
  appLogoUrl:
    'https://mpng.pngfly.com/20181202/bex/kisspng-emoji-domain-unicorn-pin-badges-sticker-unicorn-tumblr-emoji-unicorn-iphoneemoji-5c046729264a77.5671679315437924251569.jpg'
})
