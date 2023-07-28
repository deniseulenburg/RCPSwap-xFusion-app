import React, { useContext } from 'react'
import { Text } from 'rebass'
import { StyledBalanceMaxMini } from './styleds'
import { Repeat } from 'react-feather'
import { ThemeContext } from 'styled-components'
import { Price } from '@venomswap/sdk'
import { XFusionSwapType } from 'state/swap/hooks'
import { ethers } from 'ethers'

interface FusionPriceProps {
  fusionSwap: XFusionSwapType
  showInverted: boolean
  setShowInverted: (s: boolean) => void
}

export default function FusionPrice({ fusionSwap, showInverted, setShowInverted }: FusionPriceProps) {
  const theme = useContext(ThemeContext)

  const formattedPrice = () => {
    if (
      fusionSwap &&
      fusionSwap?.result &&
      fusionSwap?.parsedAmount &&
      fusionSwap?.currencies?.INPUT &&
      fusionSwap?.currencies?.OUTPUT
    ) {
      try {
        return showInverted
          ? new Price(
              fusionSwap.currencies?.OUTPUT,
              fusionSwap.currencies?.INPUT,
              ethers.BigNumber.from(fusionSwap.result.route?.amountOutBN ?? '0').toString(),
              fusionSwap.parsedAmount.raw
            )
              .invert()
              .toSignificant(6)
          : new Price(
              fusionSwap.currencies?.OUTPUT,
              fusionSwap.currencies?.INPUT,
              ethers.BigNumber.from(fusionSwap.result.route?.amountOutBN ?? '0').toString(),
              fusionSwap.parsedAmount.raw
            ).toSignificant(6)
      } catch (err) {
        return undefined
      }
    }
    return undefined
  }

  const label = showInverted
    ? `${fusionSwap.currencies?.OUTPUT?.symbol} per ${fusionSwap.currencies?.INPUT?.symbol}`
    : `${fusionSwap.currencies?.INPUT?.symbol} per ${fusionSwap.currencies?.OUTPUT?.symbol}`

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
            <div>{formattedPrice() ?? '-'}</div>&nbsp;<div>{label}</div>
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
