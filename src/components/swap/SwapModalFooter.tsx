import { Currency, Token, TokenAmount, Trade, TradeType } from '@rcpswap/sdk'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Repeat, Type } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { Field } from '../../state/swap/actions'
import { TYPE } from '../../theme'
import {
  computeSlippageAdjustedAmounts,
  computeTradePriceBreakdown,
  formatBlockchainAdjustedExecutionPrice,
  warningSeverity
} from '../../utils/prices'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'
import { StyledBalanceMaxMini, SwapCallbackError } from './styleds'
import useBlockchain from '../../hooks/useBlockchain'
import getBlockchainAdjustedCurrency from '../../utils/getBlockchainAdjustedCurrency'
import { XFusionSwapType } from 'state/swap/hooks'
import { ethers } from 'ethers'

export default function SwapModalFooter({
  trade,
  onConfirm,
  allowedSlippage,
  swapErrorMessage,
  disabledConfirm,
  swapMode,
  fusionSwap,
  outPrice
}: {
  trade: Trade | undefined
  swapMode: number
  fusionSwap: XFusionSwapType
  allowedSlippage: number
  onConfirm: () => void
  swapErrorMessage: string | undefined
  disabledConfirm: boolean
  outPrice: number
}) {
  const blockchain = useBlockchain()

  const [showInverted, setShowInverted] = useState<boolean>(false)
  const theme = useContext(ThemeContext)
  const slippageAdjustedAmounts = useMemo(() => computeSlippageAdjustedAmounts(trade, allowedSlippage), [
    allowedSlippage,
    trade
  ])
  const { priceImpactWithoutFee, realizedLPFee } = useMemo(() => computeTradePriceBreakdown(trade), [trade])
  const severity = warningSeverity(priceImpactWithoutFee)

  const tradeInputCurrency = getBlockchainAdjustedCurrency(
    blockchain,
    trade?.inputAmount.currency ?? fusionSwap?.currencies?.INPUT
  )
  const tradeOutputCurrency = getBlockchainAdjustedCurrency(
    blockchain,
    trade?.outputAmount.currency ?? fusionSwap?.currencies?.OUTPUT
  )

  return (
    <>
      <AutoColumn gap="0px">
        <RowBetween align="center">
          <Text fontWeight={400} fontSize={14} color={theme.text2}>
            Price
          </Text>
          <Text
            fontWeight={500}
            fontSize={14}
            color={theme.text1}
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              display: 'flex',
              textAlign: 'right',
              paddingLeft: '10px'
            }}
          >
            {formatBlockchainAdjustedExecutionPrice(
              swapMode,
              fusionSwap,
              trade,
              tradeInputCurrency,
              tradeOutputCurrency,
              showInverted
            )}
            <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
              <Repeat size={14} />
            </StyledBalanceMaxMini>
          </Text>
        </RowBetween>

        <RowBetween>
          {swapMode === 0 && trade && (
            <>
              <RowFixed>
                <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                  {trade?.tradeType === TradeType.EXACT_INPUT ? 'Minimum received' : 'Maximum sold'}
                </TYPE.black>
                <QuestionHelper text="Your transaction will revert if there is a large, unfavorable price movement before it is confirmed." />
              </RowFixed>
              <RowFixed>
                <TYPE.black fontSize={14}>
                  {trade?.tradeType === TradeType.EXACT_INPUT
                    ? slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4) ?? '-'
                    : slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4) ?? '-'}
                </TYPE.black>
                <TYPE.black fontSize={14} marginLeft={'4px'}>
                  {trade?.tradeType === TradeType.EXACT_INPUT
                    ? tradeOutputCurrency?.symbol
                    : tradeInputCurrency?.symbol}
                </TYPE.black>
              </RowFixed>
            </>
          )}
        </RowBetween>
        {swapMode === 0 && (
          <RowBetween>
            <RowFixed>
              <TYPE.black color={theme.text2} fontSize={14} fontWeight={400}>
                Price Impact
              </TYPE.black>
              <QuestionHelper text="The difference between the market price and your price due to trade size." />
            </RowFixed>
            <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
          </RowBetween>
        )}
        {swapMode === 1 &&
          ethers.BigNumber.from(fusionSwap.result.route?.fee?.amountOutBN ?? '0').gt('0') &&
          fusionSwap.result.route && (
            <RowBetween>
              <RowFixed>
                <TYPE.black color={theme.text2} fontSize={14} fontWeight={400}>
                  {fusionSwap.result.route.singleProviderRoute?.provider ?? 'RCP'}Swap Price
                </TYPE.black>
                <QuestionHelper text="The best price found on any Dexes on Nova." />
              </RowFixed>
              <Text
                fontWeight={500}
                fontSize={14}
                color={theme.text1}
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  display: 'flex',
                  textAlign: 'right',
                  paddingLeft: '10px'
                }}
              >
                {formatBlockchainAdjustedExecutionPrice(
                  1,
                  fusionSwap,
                  trade,
                  tradeInputCurrency,
                  tradeOutputCurrency,
                  showInverted,
                  true
                )}
                <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
                  <Repeat size={14} />
                </StyledBalanceMaxMini>
              </Text>
            </RowBetween>
          )}
        {swapMode === 0 && (
          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                Liquidity Provider Fee
              </TYPE.black>
              <QuestionHelper
                text={`A portion of each trade (0.25%) goes to liquidity providers and 0.05% for RCPswap Treasury.`}
              />
            </RowFixed>
            <TYPE.black fontSize={14}>
              {realizedLPFee ? realizedLPFee?.toSignificant(6) + ' ' + tradeInputCurrency?.symbol : '-'}
            </TYPE.black>
          </RowBetween>
        )}
        {swapMode === 1 &&
          ethers.BigNumber.from(fusionSwap.result.route?.fee?.amountOutBN ?? '0').gt('0') &&
          fusionSwap.result.route && (
            <RowBetween>
              <RowFixed>
                <Text fontSize={14} fontWeight={400} color={theme.green1}>
                  Saving
                </Text>
                <QuestionHelper text={`Saving compared with the best price found on any DEX on Nova.`} />
              </RowFixed>
              <TYPE.black fontSize={14}>
                {(
                  Math.max(
                    parseFloat(
                      new TokenAmount(
                        fusionSwap.currencies?.OUTPUT as Token,
                        ethers.BigNumber.from(fusionSwap.result.route.amountOutBN ?? '0').toString()
                      ).toExact()
                    ) -
                      parseFloat(
                        new TokenAmount(
                          fusionSwap.currencies?.OUTPUT as Token,
                          ethers.BigNumber.from(fusionSwap.result?.route.fee?.amountOutBN ?? '0').toString()
                        ).toExact()
                      ) -
                      parseFloat(
                        new TokenAmount(
                          fusionSwap.currencies?.OUTPUT as Token,
                          ethers.BigNumber.from(
                            fusionSwap.result.route.singleProviderRoute?.amountOutBN ?? '0'
                          ).toString()
                        ).toExact()
                      ),
                    0
                  ) * (outPrice === 0 ? 1 : outPrice)
                ).toFixed(6) +
                  ' ' +
                  (outPrice === 0 ? tradeOutputCurrency?.symbol : '$')}
              </TYPE.black>
            </RowBetween>
          )}
      </AutoColumn>

      <AutoRow>
        <ButtonError
          onClick={onConfirm}
          disabled={disabledConfirm}
          error={severity > 2}
          style={{ margin: '10px 0 0 0' }}
          id="confirm-swap-or-send"
        >
          <Text fontSize={20} fontWeight={500}>
            {severity > 2 && swapMode === 0 ? 'Swap Anyway' : 'Confirm Swap'}
          </Text>
        </ButtonError>

        {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </AutoRow>
    </>
  )
}
