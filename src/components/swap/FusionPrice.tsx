import React, { useContext } from 'react'
import { Text } from 'rebass'
import { StyledBalanceMaxMini } from './styleds'
import { Repeat } from 'react-feather'
import { ThemeContext } from 'styled-components'
import { Currency, CurrencyAmount, Fraction } from '@venomswap/sdk'

interface FusionPriceProps {
  fusionSwap: any
  showInverted: boolean
  setShowInverted: (s: boolean) => void
  tokenIn?: Currency
  tokenOut?: Currency
  loading: boolean
}

export default function FusionPrice({
  fusionSwap,
  showInverted,
  setShowInverted,
  tokenIn,
  tokenOut,
  loading
}: FusionPriceProps) {
  const theme = useContext(ThemeContext)
  const formattedPrice =
    fusionSwap.price && fusionSwap.amountIn
      ? showInverted
        ? new Fraction(fusionSwap?.price.raw, fusionSwap?.amountIn.raw).toFixed(6)
        : new Fraction(fusionSwap?.amountIn.raw, fusionSwap?.price.raw).toFixed(6)
      : undefined
  const label = showInverted
    ? `${tokenOut?.symbol} per ${tokenIn?.symbol}`
    : `${tokenIn?.symbol} per ${tokenOut?.symbol}`
  return (
    <Text
      fontWeight={500}
      fontSize={14}
      color={theme.text2}
      style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}
    >
      {fusionSwap.amountIn && fusionSwap.price && !loading ? (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'end' }}>
            <div>{formattedPrice ?? '-'}</div> <div>{label}</div>
          </div>
          <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
            <Repeat size={14} />
          </StyledBalanceMaxMini>
        </>
      ) : (
        '-'
      )}
    </Text>
  )
}
