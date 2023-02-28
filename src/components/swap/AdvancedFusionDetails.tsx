import React, { useContext } from 'react'
import { ThemeContext } from 'styled-components'
import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { RowBetween, RowFixed } from '../Row'

function TradeSummary({ swap, price }: { swap: any; price: number }) {
  const theme = useContext(ThemeContext)

  return (
    <>
      <AutoColumn style={{ padding: '0 16px' }}>
        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
              Fusion Provider Fee
            </TYPE.black>
            <QuestionHelper text={`A portion of profit (10%) from the fusion goes to fusion provider.`} />
          </RowFixed>
          <TYPE.black fontSize={14}>{(swap?.fee ?? 0).toFixed(6) + ' ' + swap.tokenOut?.symbol}</TYPE.black>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
              Saving
            </TYPE.black>
            <QuestionHelper text={`Savings comparing the best multihop swap and fushion swap.`} />
          </RowFixed>
          <TYPE.black fontSize={14}>
            {(
              ((swap?.price ?? 0) - (swap?.maxMultihop?.trade?.outputAmount?.toExact() ?? 0)) *
              (price === 0 ? 1 : price)
            ).toFixed(6) +
              ' ' +
              (price === 0 ? swap.tokenOut?.symbol : '$')}
          </TYPE.black>
        </RowBetween>
      </AutoColumn>
    </>
  )
}

export function AdvancedFusionDetails({ swap, price }: { swap: any; price: number }) {
  return <AutoColumn gap="0px">{swap && swap.type === 0 && <TradeSummary swap={swap} price={price} />}</AutoColumn>
}
