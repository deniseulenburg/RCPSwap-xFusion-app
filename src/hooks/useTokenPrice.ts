import { Currency, Token } from '@rcpswap/sdk'
import axios from 'axios'
import { useEffect, useState } from 'react'

export const useTokenPrice = (token: Currency | undefined, fetch: boolean) => {
  const [price, setPrice] = useState(0)

  useEffect(() => {
    async function getPrice() {
      try {
        if (token?.symbol === 'ETH') {
          const data = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=weth&vs_currencies=usd')
          setPrice(data?.data?.weth?.usd ?? 0)
        } else if ((token as Token)?.address) {
          const data = await axios.get(
            `https://api.coingecko.com/api/v3/coins/arbitrum_nova_ecosystem/contract/${(token as Token).address}`
          )
          setPrice(data?.data?.['market_data']?.['current_price']?.usd ?? 0)
        } else {
          setPrice(0)
        }
      } catch (err) {
        setPrice(0)
      }
    }
    if (token && fetch) getPrice()
  }, [token?.name, fetch])
  return price
}
