import React from 'react'
import styled from 'styled-components'
import Settings from '../Settings'
import { RowBetween } from '../Row'
import { TYPE } from '../../theme'
import { ExchangeSVG } from 'components/svgs'
import { useSwapActionHandlers, useSwapState } from 'state/swap/hooks'

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

export default function SwapHeader() {
  const { swapMode } = useSwapState()
  const { onSwitchSwapMode } = useSwapActionHandlers()
  return (
    <StyledSwapHeader>
      <RowBetween>
        <SwitchTitle onClick={onSwitchSwapMode}>
          <TYPE.black fontWeight={500} marginRight={'5px'}>
            {swapMode === 0 ? 'Swap' : 'xFusion'}
          </TYPE.black>
          <ExchangeSVG></ExchangeSVG>
          <PassiveTab fontWeight={500} marginLeft={'5px'}>
            {swapMode === 0 ? 'xFusion' : 'Swap'}
          </PassiveTab>
        </SwitchTitle>
        <Settings />
      </RowBetween>
    </StyledSwapHeader>
  )
}
