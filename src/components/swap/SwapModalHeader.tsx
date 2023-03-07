import { TokenAmount, Trade, TradeType } from '@venomswap/sdk'
import React, { useContext, useMemo } from 'react'
import { ArrowDown, AlertTriangle } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { Field } from '../../state/swap/actions'
import { TYPE } from '../../theme'
import { ButtonPrimary } from '../Button'
import { calculateSlippageAmount, isAddress, shortenAddress } from '../../utils'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown, warningSeverity } from '../../utils/prices'
import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import { RowBetween, RowFixed } from '../Row'
import { TruncatedText, SwapShowAcceptChanges } from './styleds'

import useBlockchain from '../../hooks/useBlockchain'
import getBlockchainAdjustedCurrency from '../../utils/getBlockchainAdjustedCurrency'

export default function SwapModalHeader({
  trade,
  allowedSlippage,
  recipient,
  showAcceptChanges,
  onAcceptChanges,
  swapMode,
  fusionSwap
}: {
  trade: Trade | undefined
  swapMode: number
  fusionSwap: any
  allowedSlippage: number
  recipient: string | null
  showAcceptChanges: boolean
  onAcceptChanges: () => void
}) {
  const blockchain = useBlockchain()
  const slippageAdjustedAmounts = useMemo(() => computeSlippageAdjustedAmounts(trade, allowedSlippage), [
    trade,
    allowedSlippage
  ])
  const { priceImpactWithoutFee } = useMemo(() => computeTradePriceBreakdown(trade), [trade])
  const priceImpactSeverity = warningSeverity(priceImpactWithoutFee)

  const tradeInputCurrency = getBlockchainAdjustedCurrency(
    blockchain,
    trade?.inputAmount.currency ?? fusionSwap.tokenIn
  )
  const tradeOutputCurrency = getBlockchainAdjustedCurrency(
    blockchain,
    trade?.outputAmount.currency ?? fusionSwap.tokenOut
  )

  const theme = useContext(ThemeContext)

  return (
    <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
      <RowBetween align="flex-end">
        <RowFixed gap={'0px'}>
          <CurrencyLogo currency={tradeInputCurrency} size={'24px'} style={{ marginRight: '12px' }} />
          <TruncatedText
            fontSize={24}
            fontWeight={500}
            color={showAcceptChanges && trade?.tradeType === TradeType.EXACT_OUTPUT ? theme.primary1 : ''}
          >
            {trade?.inputAmount.toSignificant(6) ?? fusionSwap?.amountIn?.toSignificant(6)}
          </TruncatedText>
        </RowFixed>
        <RowFixed gap={'0px'}>
          <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
            {tradeInputCurrency?.symbol}
          </Text>
        </RowFixed>
      </RowBetween>
      <RowFixed>
        <ArrowDown size="16" color={theme.text2} style={{ marginLeft: '4px', minWidth: '16px' }} />
      </RowFixed>
      <RowBetween align="flex-end">
        <RowFixed gap={'0px'}>
          <CurrencyLogo currency={tradeOutputCurrency} size={'24px'} style={{ marginRight: '12px' }} />
          <TruncatedText
            fontSize={24}
            fontWeight={500}
            color={
              priceImpactSeverity > 2
                ? theme.red1
                : showAcceptChanges && trade?.tradeType === TradeType.EXACT_INPUT
                ? theme.primary1
                : ''
            }
          >
            {swapMode === 0 ? trade?.outputAmount.toSignificant(6) : fusionSwap?.price?.toSignificant(6)}
          </TruncatedText>
        </RowFixed>
        <RowFixed gap={'0px'}>
          <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
            {tradeOutputCurrency?.symbol}
          </Text>
        </RowFixed>
      </RowBetween>
      {showAcceptChanges ? (
        <SwapShowAcceptChanges justify="flex-start" gap={'0px'}>
          <RowBetween>
            <RowFixed>
              <AlertTriangle size={20} style={{ marginRight: '8px', minWidth: 24 }} />
              <TYPE.main color={theme.primary1}> Price Updated</TYPE.main>
            </RowFixed>
            <ButtonPrimary
              style={{ padding: '.5rem', width: 'fit-content', fontSize: '0.825rem', borderRadius: '12px' }}
              onClick={onAcceptChanges}
            >
              Accept
            </ButtonPrimary>
          </RowBetween>
        </SwapShowAcceptChanges>
      ) : null}
      <AutoColumn justify="flex-start" gap="sm" style={{ padding: '12px 0 0 0px' }}>
        {trade?.tradeType === TradeType.EXACT_INPUT || swapMode === 1 ? (
          <TYPE.italic textAlign="left" style={{ width: '100%' }}>
            {`Output is estimated. You will receive at least `}
            <b>
              {swapMode === 0
                ? slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(6)
                : fusionSwap.price
                ? new TokenAmount(
                    fusionSwap.price.token,
                    calculateSlippageAmount(fusionSwap.price, allowedSlippage)[0]
                  ).toSignificant(6)
                : '0'}
              {tradeOutputCurrency?.symbol}
            </b>
            {' or the transaction will revert.'}
          </TYPE.italic>
        ) : (
          <TYPE.italic textAlign="left" style={{ width: '100%' }}>
            {`Input is estimated. You will sell at most `}
            <b>
              {slippageAdjustedAmounts[Field.INPUT]?.toSignificant(6)} {tradeInputCurrency?.symbol}
            </b>
            {' or the transaction will revert.'}
          </TYPE.italic>
        )}
      </AutoColumn>
      {recipient !== null ? (
        <AutoColumn justify="flex-start" gap="sm" style={{ padding: '12px 0 0 0px' }}>
          <TYPE.main>
            Output will be sent to{' '}
            <b title={recipient}>{isAddress(recipient) ? shortenAddress(recipient) : recipient}</b>
          </TYPE.main>
        </AutoColumn>
      ) : null}
    </AutoColumn>
  )
}
