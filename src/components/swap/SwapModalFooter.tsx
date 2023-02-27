import { Currency, Token, Trade, TradeType } from '@venomswap/sdk'
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
import useBUSDPrice from '../../hooks/useBUSDPrice'
import getBlockchainAdjustedCurrency from '../../utils/getBlockchainAdjustedCurrency'
import axios from 'axios'

export const useTokenPrice = (token: Currency, fetch: boolean) => {
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
    if (fetch) getPrice()
  }, [token.name, fetch])
  return price
}

export default function SwapModalFooter({
  trade,
  onConfirm,
  allowedSlippage,
  swapErrorMessage,
  disabledConfirm,
  swapMode,
  fusionSwap
}: {
  trade: Trade
  swapMode: number
  fusionSwap: any
  allowedSlippage: number
  onConfirm: () => void
  swapErrorMessage: string | undefined
  disabledConfirm: boolean
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

  const tradeInputCurrency = getBlockchainAdjustedCurrency(blockchain, trade.inputAmount.currency)
  const tradeOutputCurrency = getBlockchainAdjustedCurrency(blockchain, trade.outputAmount.currency)

  const outputPrice = useTokenPrice(fusionSwap?.tokenOut,true)

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
          {swapMode === 0 && (
            <>
              <RowFixed>
                <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                  {trade.tradeType === TradeType.EXACT_INPUT ? 'Minimum received' : 'Maximum sold'}
                </TYPE.black>
                <QuestionHelper text="Your transaction will revert if there is a large, unfavorable price movement before it is confirmed." />
              </RowFixed>
              <RowFixed>
                <TYPE.black fontSize={14}>
                  {trade.tradeType === TradeType.EXACT_INPUT
                    ? slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4) ?? '-'
                    : slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4) ?? '-'}
                </TYPE.black>
                <TYPE.black fontSize={14} marginLeft={'4px'}>
                  {trade.tradeType === TradeType.EXACT_INPUT ? tradeOutputCurrency?.symbol : tradeInputCurrency?.symbol}
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
        {swapMode === 1 && fusionSwap.type === 0 && (fusionSwap?.fee ?? 0) > 0 && (
          <RowBetween>
            <RowFixed>
              <TYPE.black color={theme.text2} fontSize={14} fontWeight={400}>
                Multihop
              </TYPE.black>
              <QuestionHelper text="The difference between the market price and your price due to trade size." />
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
                0,
                null,
                fusionSwap.maxMultihop.trade,
                tradeInputCurrency,
                tradeOutputCurrency,
                showInverted
              )}
              <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
                <Repeat size={14} />
              </StyledBalanceMaxMini>
            </Text>
          </RowBetween>
        )}
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
        {swapMode === 1 && fusionSwap.type === 0 && (fusionSwap?.fee ?? 0) > 0 && (
          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                Fusion Provider Fee
              </TYPE.black>
              <QuestionHelper text={`A portion of profit (10%) from the fusion goes to fusion provider.`} />
            </RowFixed>
            <TYPE.black fontSize={14}>
              {(fusionSwap?.fee ?? 0).toFixed(6) + ' ' + tradeOutputCurrency?.symbol}
            </TYPE.black>
          </RowBetween>
        )}
        {swapMode === 1 && fusionSwap.type === 0 && (fusionSwap?.fee ?? 0) > 0 && (
          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                Saving
              </TYPE.black>
              <QuestionHelper text={`Savings comparing the best multihop swap and fushion swap.`} />
            </RowFixed>
            <TYPE.black fontSize={14}>
              {(
                ((fusionSwap?.price ?? 0) - (fusionSwap?.maxMultihop?.trade?.outputAmount?.toExact() ?? 0)) *
                (outputPrice === 0 ? 1 : outputPrice)
              ).toFixed(6) +
                ' ' +
                (outputPrice === 0 ? tradeOutputCurrency?.symbol : '$')}
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
            {severity > 2 ? 'Swap Anyway' : 'Confirm Swap'}
          </Text>
        </ButtonError>

        {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </AutoRow>
    </>
  )
}
