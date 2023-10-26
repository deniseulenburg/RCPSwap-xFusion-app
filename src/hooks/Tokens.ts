import { TokenAddressMap, useDefaultTokenList, useUnsupportedTokenList } from './../state/lists/hooks'
import { parseBytes32String } from '@ethersproject/strings'
import { ChainId, Currency, Token, currencyEquals } from '@rcpswap/sdk'
import { useMemo } from 'react'
import { useCombinedActiveList, useCombinedInactiveList } from '../state/lists/hooks'
import { NEVER_RELOAD, useSingleCallResult } from '../state/multicall/hooks'
import { useUserAddedTokens } from '../state/user/hooks'
import { isAddress } from '../utils'

import { useActiveWeb3React } from './index'
import { useBytes32TokenContract, useTokenContract } from './useContract'
import { filterTokens } from '../components/SearchModal/filtering'
import { arrayify } from 'ethers/lib/utils'

import { BASE_CURRENCY } from '../connectors'
import baseCurrencies from 'utils/baseCurrencies'

// reduce token map into standard address <-> Token mapping, optionally include user added tokens
function useTokensFromMap(tokenMap: TokenAddressMap, includeUserAdded: boolean, chainId?: ChainId): { [address: string]: Token } {
  const chain = chainId ?? ChainId.ARBITRUM_NOVA

  const userAddedTokens = useUserAddedTokens(chain)

  return useMemo(() => {
    if (!chain) return {}

    // reduce to just tokens
    const mapWithoutUrls = Object.keys(tokenMap[chain]).reduce<{ [address: string]: Token }>((newMap, address) => {
      newMap[address] = tokenMap[chain][address].token
      return newMap
    }, {})

    if (includeUserAdded) {
      return (
        userAddedTokens.filter(token => token.chainId === chain)
          // reduce into all ALL_TOKENS filtered by the current chain
          .reduce<{ [address: string]: Token }>(
            (tokenMap, token) => {
              tokenMap[token.address] = token
              return tokenMap
            },
            // must make a copy because reduce modifies the map, and we do not
            // want to make a copy in every iteration
            { ...mapWithoutUrls }
          )
      )
    }

    return mapWithoutUrls
  }, [chainId, userAddedTokens, tokenMap, includeUserAdded])
}

export function useDefaultTokens(): { [address: string]: Token } {
  const defaultList = useDefaultTokenList()
  return useTokensFromMap(defaultList, false)
}

export function useAllTokens(chainId?: ChainId): { [address: string]: Token } {
  const allTokens = useCombinedActiveList()
  return useTokensFromMap(allTokens, true, chainId)
}

export function useAllInactiveTokens(): { [address: string]: Token } {
  // get inactive tokens
  const inactiveTokensMap = useCombinedInactiveList()
  const inactiveTokens = useTokensFromMap(inactiveTokensMap, false)

  // filter out any token that are on active list
  const activeTokensAddresses = Object.keys(useAllTokens())
  const filteredInactive = activeTokensAddresses
    ? Object.keys(inactiveTokens).reduce<{ [address: string]: Token }>((newMap, address) => {
      if (!activeTokensAddresses.includes(address)) {
        newMap[address] = inactiveTokens[address]
      }
      return newMap
    }, {})
    : inactiveTokens

  return filteredInactive
}

export function useUnsupportedTokens(): { [address: string]: Token } {
  const unsupportedTokensMap = useUnsupportedTokenList()
  return useTokensFromMap(unsupportedTokensMap, false)
}

export function useIsTokenActive(token: Token | undefined | null, chainId?: ChainId): boolean {
  const activeTokens = useAllTokens(chainId)

  if (!activeTokens || !token) {
    return false
  }

  return !!activeTokens[token.address]
}

// used to detect extra search results
export function useFoundOnInactiveList(searchQuery: string): Token[] | undefined {
  const { chainId } = useActiveWeb3React()
  const inactiveTokens = useAllInactiveTokens()

  return useMemo(() => {
    if (!chainId || searchQuery === '') {
      return undefined
    } else {
      const tokens = filterTokens(Object.values(inactiveTokens), searchQuery)
      return tokens
    }
  }, [chainId, inactiveTokens, searchQuery])
}

// Check if currency is included in custom list from user storage
export function useIsUserAddedToken(currency: Currency | undefined | null, chainId?: ChainId): boolean {
  const userAddedTokens = useUserAddedTokens(chainId)

  if (!currency) {
    return false
  }

  return !!userAddedTokens.find(token => currencyEquals(currency, token))
}

// parse a name or symbol from a token response
const BYTES32_REGEX = /^0x[a-fA-F0-9]{64}$/

function parseStringOrBytes32(str: string | undefined, bytes32: string | undefined, defaultValue: string): string {
  return str && str.length > 0
    ? str
    : // need to check for proper bytes string and valid terminator
    bytes32 && BYTES32_REGEX.test(bytes32) && arrayify(bytes32)[31] === 0
      ? parseBytes32String(bytes32)
      : defaultValue
}

// undefined if invalid or does not exist
// null if loading
// otherwise returns the token
export function useToken(tokenAddress?: string, chainId?: ChainId): Token | undefined | null {
  const chain = chainId ?? ChainId.ARBITRUM_NOVA
  const tokens = useAllTokens(chain)

  const address = isAddress(tokenAddress)

  const tokenContract = useTokenContract(address ? address : undefined, false, chain)
  const tokenContractBytes32 = useBytes32TokenContract(address ? address : undefined, false, chain)
  const token: Token | undefined = address ? tokens[address] : undefined

  const tokenName = useSingleCallResult(token ? undefined : tokenContract, 'name', undefined, chain, NEVER_RELOAD)
  const tokenNameBytes32 = useSingleCallResult(
    token ? undefined : tokenContractBytes32,
    'name',
    undefined,
    chain,
    NEVER_RELOAD
  )
  const symbol = useSingleCallResult(token ? undefined : tokenContract, 'symbol', undefined, chain, NEVER_RELOAD)
  const symbolBytes32 = useSingleCallResult(token ? undefined : tokenContractBytes32, 'symbol', undefined, chain, NEVER_RELOAD)
  const decimals = useSingleCallResult(token ? undefined : tokenContract, 'decimals', undefined, chain, NEVER_RELOAD)

  return useMemo(() => {
    if (token) return token
    if (!chain || !address) return undefined
    if (decimals.loading || symbol.loading || tokenName.loading) return null
    if (decimals.result) {
      return new Token(
        chain,
        address,
        decimals.result[0],
        parseStringOrBytes32(symbol.result?.[0], symbolBytes32.result?.[0], 'UNKNOWN'),
        parseStringOrBytes32(tokenName.result?.[0], tokenNameBytes32.result?.[0], 'Unknown Token')
      )
    }
    return undefined
  }, [
    address,
    chain,
    decimals.loading,
    decimals.result,
    symbol.loading,
    symbol.result,
    symbolBytes32.result,
    token,
    tokenName.loading,
    tokenName.result,
    tokenNameBytes32.result
  ])
}

export function useCurrency(currencyId: string | undefined, chainId?: ChainId): Currency | null | undefined {
  const baseCurrency = baseCurrencies(chainId ?? ChainId.ARBITRUM_NOVA)[0]
  const isETH = currencyId?.toUpperCase() === baseCurrency.symbol
  const token = useToken(isETH ? undefined : currencyId, chainId)
  return isETH ? baseCurrency : token
}
