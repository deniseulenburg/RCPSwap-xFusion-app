import { Blockchain, Currency, ETHER, BINANCE_COIN, HARMONY, Token } from '@venomswap/sdk'

export default function getBlockchainAdjustedCurrency(
  blockchain: Blockchain,
  currency: Currency | undefined
): Currency | undefined {
  if (!currency) return currency
  if (currency !== ETHER) {
    const token = currency as Token
    return new Token(token.chainId, token.address, token.decimals, 'LP-RCPSwap', 'RCPswap V2 TOKEN')
  }
  switch (blockchain) {
    case Blockchain.BINANCE_SMART_CHAIN:
      return BINANCE_COIN
    case Blockchain.HARMONY:
      return HARMONY
    default:
      return ETHER
  }
}
