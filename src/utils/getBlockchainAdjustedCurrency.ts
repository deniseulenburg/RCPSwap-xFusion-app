import { Blockchain, Currency, ETHER, BINANCE_COIN } from '@rcpswap/sdk'

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
    default:
      return ETHER
  }
}
