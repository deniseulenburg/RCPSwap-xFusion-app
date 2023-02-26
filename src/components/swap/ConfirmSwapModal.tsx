import { currencyEquals, Trade } from '@venomswap/sdk'
import React, { useCallback, useMemo } from 'react'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent
} from '../TransactionConfirmationModal'
import SwapModalFooter from './SwapModalFooter'
import SwapModalHeader from './SwapModalHeader'

import useBlockchain from '../../hooks/useBlockchain'
import getBlockchainAdjustedCurrency from '../../utils/getBlockchainAdjustedCurrency'
import useFusionFee from 'hooks/useFusionFee'

/**
 * Returns true if the trade requires a confirmation of details before we can submit it
 * @param tradeA trade A
 * @param tradeB trade B
 */
function tradeMeaningfullyDiffers(tradeA: Trade, tradeB: Trade): boolean {
  return (
    tradeA.tradeType !== tradeB.tradeType ||
    !currencyEquals(tradeA.inputAmount.currency, tradeB.inputAmount.currency) ||
    !tradeA.inputAmount.equalTo(tradeB.inputAmount) ||
    !currencyEquals(tradeA.outputAmount.currency, tradeB.outputAmount.currency) ||
    !tradeA.outputAmount.equalTo(tradeB.outputAmount)
  )
}

export default function ConfirmSwapModal({
  trade,
  originalTrade,
  onAcceptChanges,
  allowedSlippage,
  onConfirm,
  onDismiss,
  recipient,
  swapErrorMessage,
  isOpen,
  attemptingTxn,
  txHash,
  swapMode,
  fusionSwap
}: {
  isOpen: boolean
  trade: Trade | undefined
  originalTrade: Trade | undefined
  attemptingTxn: boolean
  txHash: string | undefined
  recipient: string | null
  allowedSlippage: number
  onAcceptChanges: () => void
  onConfirm: () => void
  swapErrorMessage: string | undefined
  onDismiss: () => void
  swapMode: number
  fusionSwap: any
}) {
  const blockchain = useBlockchain()
  const fee = useFusionFee()

  const showAcceptChanges = useMemo(
    () => Boolean(trade && originalTrade && tradeMeaningfullyDiffers(trade, originalTrade)),
    [originalTrade, trade]
  )

  const modalHeader = useCallback(() => {
    return trade ? (
      <SwapModalHeader
        trade={trade}
        fusionSwap={fusionSwap}
        swapMode={swapMode}
        allowedSlippage={allowedSlippage}
        recipient={recipient}
        showAcceptChanges={showAcceptChanges}
        onAcceptChanges={onAcceptChanges}
        fee={fee}
      />
    ) : null
  }, [allowedSlippage, onAcceptChanges, recipient, showAcceptChanges, trade])

  const modalBottom = useCallback(() => {
    return trade ? (
      <SwapModalFooter
        onConfirm={onConfirm}
        trade={trade}
        swapMode={swapMode}
        fusionSwap={fusionSwap}
        disabledConfirm={showAcceptChanges}
        swapErrorMessage={swapErrorMessage}
        allowedSlippage={allowedSlippage}
        fee={fee}
      />
    ) : null
  }, [allowedSlippage, onConfirm, showAcceptChanges, swapErrorMessage, trade])

  const adjustedInputCurrency = getBlockchainAdjustedCurrency(blockchain, trade?.inputAmount?.currency)
  const adjustedOutputCurrency = getBlockchainAdjustedCurrency(blockchain, trade?.outputAmount?.currency)

  const fusionAmount =
    swapMode === 1
      ? fusionSwap?.type === 0
        ? (parseFloat(fusionSwap?.maxMultihop?.trade?.outputAmount.toExact() ?? '0') * fee) / 1000 +
          ((fusionSwap?.price ?? 0) * (1000 - fee)) / 1000
        : fusionSwap?.price ?? 0
      : 0
  // text to show while loading
  const pendingText = `Swapping ${trade?.inputAmount?.toSignificant(6)} ${adjustedInputCurrency?.symbol} for ${
    swapMode === 0 ? trade?.outputAmount?.toSignificant(6) : fusionAmount.toFixed(6)
  } ${adjustedOutputCurrency?.symbol}`

  const confirmationContent = useCallback(() => {
    return swapErrorMessage ? (
      <TransactionErrorContent onDismiss={onDismiss} message={swapErrorMessage} />
    ) : (
      <ConfirmationModalContent
        title="Confirm Swap"
        onDismiss={onDismiss}
        topContent={modalHeader}
        bottomContent={modalBottom}
      />
    )
  }, [onDismiss, modalBottom, modalHeader, swapErrorMessage])

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={confirmationContent}
      pendingText={pendingText}
      currencyToAdd={trade?.outputAmount.currency}
    />
  )
}
