import React, { useContext } from 'react'
import { Text } from 'rebass'
import { StyledBalanceMaxMini } from './styleds'
import { Repeat } from 'react-feather'
import { ThemeContext } from 'styled-components'
import { Currency, Fraction, JSBI, Price } from '@venomswap/sdk'

interface FusionPriceProps {
  fusionSwap: any
  showInverted: boolean
  setShowInverted: (s: boolean) => void
  tokenIn?: Currency
  tokenOut?: Currency
}

export default function FusionPrice({
  fusionSwap,
  showInverted,
  setShowInverted,
  tokenIn,
  tokenOut
}: FusionPriceProps) {
  const theme = useContext(ThemeContext)

  const formattedPrice = () => {
    if (fusionSwap && fusionSwap.result && fusionSwap.parsedAmount) {
      try {
        return showInverted
          ? new Price(
              fusionSwap.result.currency,
              fusionSwap.parsedAmount.currency,
              fusionSwap.result.raw,
              fusionSwap.parsedAmount.raw
            )
              .invert()
              .toSignificant(6)
          : new Price(
              fusionSwap.result.currency,
              fusionSwap.parsedAmount.currency,
              fusionSwap.result.raw,
              fusionSwap.parsedAmount.raw
            ).toSignificant(6)
      } catch (err) {
        return undefined
      }
    }
    return undefined
  }

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
      {fusionSwap && fusionSwap.parsedAmount && fusionSwap.result ? (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'end' }}>
            <div>{formattedPrice() ?? '-'}</div> <div>{label}</div>
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
