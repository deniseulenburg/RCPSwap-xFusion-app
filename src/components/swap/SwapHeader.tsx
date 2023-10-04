import React from 'react'
import styled from 'styled-components'
import Settings from '../Settings'
import { RowBetween } from '../Row'
import { TYPE } from '../../theme'
import { ExchangeSVG } from 'components/svgs'
import { useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import QuestionHelper from 'components/QuestionHelper'

const StyledSwapHeader = styled.div`
  padding: 12px 1rem 0px 1.5rem;
  margin-bottom: -4px;
  width: 100%;
  max-width: 420px;
  color: ${({ theme }) => theme.text2};
  stroke: ${({ theme }) => theme.text2};
`

const PassiveTab = styled(TYPE.black)`
  color: ${({ theme }) => theme.text3};
`

const SwitchTitle = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`

const FUSION_TEXT =
  'xFusion is DEX Aggregator Algorithm that thrives to calculate the most efficient route possible for the trade you entered - giving you the best trade possible.'
const SWAP_TEXT =
  'When using the ‘Swap’ function, you’re directly interacting only with RCPswapV2 pools, Unlike xFusion where you get deeper liquidity by accessing multiple DEXs and Pools.'

export default function SwapHeader() {
  const { swapMode } = useSwapState()
  const { onSwitchSwapMode } = useSwapActionHandlers()
  return (
    <StyledSwapHeader>
      <RowBetween>
        <SwitchTitle>
          <TYPE.black fontWeight={500} onClick={onSwitchSwapMode}>
            {swapMode === 0 ? 'Swap' : 'xFusion'}
          </TYPE.black>
          <QuestionHelper text={swapMode === 0 ? SWAP_TEXT : FUSION_TEXT} />
          &nbsp;
          <span onClick={onSwitchSwapMode} style={{ display: 'flex', alignItems: 'center' }}>
            <ExchangeSVG></ExchangeSVG>
          </span>
          <PassiveTab fontWeight={500} marginLeft={'5px'} onClick={onSwitchSwapMode}>
            {swapMode === 0 ? 'xFusion' : 'Swap'}
          </PassiveTab>
        </SwitchTitle>
        <Settings />
      </RowBetween>
    </StyledSwapHeader>
  )
}
