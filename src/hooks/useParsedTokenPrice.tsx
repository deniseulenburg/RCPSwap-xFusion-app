import { ChainId, Currency, Fraction } from '@rcpswap/sdk'
import { useMemo } from 'react'
import { tryParseAmount } from 'state/swap/hooks'
import usePrice from './usePrice'
import { wrappedCurrency } from 'utils/wrappedCurrency'

const useParsedTokenPrice = (currency: Currency | undefined, value: string) => {
  const { data: price, isInitialLoading: isLoading } = usePrice(
    wrappedCurrency(currency, ChainId.ARBITRUM_NOVA)?.address
  )
  const parsedValue = useMemo(() => tryParseAmount(value, currency), [currency, value])
  return {
    loading: isLoading,
    price,
    totalPrice: parsedValue && price ? parsedValue.multiply(price) : new Fraction('0')
  }
}

export default useParsedTokenPrice
