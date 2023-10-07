import { currencyEquals, Token, TokenAmount, Trade } from '@rcpswap/sdk'
import React, { useCallback, useMemo } from 'react'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent
} from '../TransactionConfirmationModal'
import SwapModalFooter from './SwapModalFooter'
import SwapModalHeader from './SwapModalHeader'

import useBlockchain from '../../hooks/useBlockchain'
import getBlockchainAdjustedCurrency from '../../utils/getBlockchainAdjustedCurrency'
import { XFusionSwapType } from 'state/swap/hooks'
import { ethers } from 'ethers'

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
  fusionSwap: XFusionSwapType
}) {
  const blockchain = useBlockchain()

  const showAcceptChanges = useMemo(
    () => Boolean(trade && originalTrade && tradeMeaningfullyDiffers(trade, originalTrade)),
    [originalTrade, trade]
  )

  const modalHeader = useCallback(() => {
    return trade || swapMode === 1 ? (
      <SwapModalHeader
        trade={trade}
        fusionSwap={fusionSwap}
        swapMode={swapMode}
        allowedSlippage={allowedSlippage}
        recipient={recipient}
        showAcceptChanges={showAcceptChanges}
        onAcceptChanges={onAcceptChanges}
      />
    ) : null
  }, [allowedSlippage, onAcceptChanges, recipient, showAcceptChanges, trade])

  const modalBottom = useCallback(() => {
    return trade || swapMode === 1 ? (
      <SwapModalFooter
        onConfirm={onConfirm}
        trade={trade}
        swapMode={swapMode}
        fusionSwap={fusionSwap}
        disabledConfirm={showAcceptChanges}
        swapErrorMessage={swapErrorMessage}
        allowedSlippage={allowedSlippage}
      />
    ) : null
  }, [allowedSlippage, onConfirm, showAcceptChanges, swapErrorMessage, trade])

  const adjustedInputCurrency = getBlockchainAdjustedCurrency(
    blockchain,
    trade?.inputAmount?.currency ?? fusionSwap?.currencies?.INPUT
  )
  const adjustedOutputCurrency = getBlockchainAdjustedCurrency(
    blockchain,
    trade?.outputAmount?.currency ?? fusionSwap?.currencies?.OUTPUT
  )

  // text to show while loading
  const pendingText = `Swapping ${trade?.inputAmount?.toSignificant(6) ?? fusionSwap.parsedAmount?.toSignificant(6)} ${
    adjustedInputCurrency?.symbol
  } for ${
    swapMode === 0
      ? trade?.outputAmount?.toSignificant(6)
      : fusionSwap.currencies?.OUTPUT
      ? new TokenAmount(
          fusionSwap.currencies?.OUTPUT as Token,
          ethers.BigNumber.from(fusionSwap?.result.route?.amountOutBN ?? '0')
            .sub(fusionSwap.result?.route?.fee?.amountOutBN ?? '0')
            .toString()
        ).toSignificant(6)
      : '0'
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
