import { Blockchain, Currency, ETHER, BINANCE_COIN, MATIC_TOKEN } from '@rcpswap/sdk'

export default function getBlockchainAdjustedCurrency(
  blockchain: Blockchain,
  currency: Currency | undefined
): Currency | undefined {
  if (!currency) return currency
  if (currency !== ETHER) return currency
  switch (blockchain) {
    case Blockchain.BINANCE_SMART_CHAIN:
      return BINANCE_COIN
    case Blockchain.NOVA:
      return ETHER
    case Blockchain.POLYGON:
      return MATIC_TOKEN
    default:
      return ETHER
  }
}
