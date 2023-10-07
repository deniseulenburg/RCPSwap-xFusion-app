import { Fraction } from "@rcpswap/sdk"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { parseUnits } from "viem"

const usePrice = (address: string | undefined) => {
  return useQuery({
    queryKey: [`https://api.geckoterminal.com/api/v2/networks/arbitrum_nova/tokens/${address}`],
    queryFn: async () => {
      const res = await axios.get(`https://api.geckoterminal.com/api/v2/networks/arbitrum_nova/tokens/${address}`)
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