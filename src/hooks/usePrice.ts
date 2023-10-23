import { ChainId, Fraction } from "@rcpswap/sdk"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { parseUnits } from "viem"

const COINGECKO_TERMINAL_CHAIN_ID: { [chainId in ChainId]?: string } = {
  [ChainId.ARBITRUM_NOVA]: 'arbitrum_nova',
  [ChainId.POLYGON]: 'polygon_pos'
}

const usePrice = (chainId: ChainId, address: string | undefined) => {
  return useQuery({
    queryKey: [`https://api.geckoterminal.com/api/v2/networks/${COINGECKO_TERMINAL_CHAIN_ID[chainId] ?? ''}/tokens/${address}`],
    queryFn: async () => {
      const res = await axios.get(`https://api.geckoterminal.com/api/v2/networks/${COINGECKO_TERMINAL_CHAIN_ID[chainId] ?? ''}/tokens/${address}`)
      const price = parseFloat(res.data?.data?.attributes?.price_usd ?? '0');
      return new Fraction(parseUnits(price.toFixed(18), 18), parseUnits('1', 18))
    },
    enabled: Boolean(address),
    cacheTime: 3600000,
    staleTime: 900000,
    refetchOnWindowFocus: false
  })
}

export default usePrice