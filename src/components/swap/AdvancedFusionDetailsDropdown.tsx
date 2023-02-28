import React from 'react'
import styled from 'styled-components'
import { AdvancedFusionDetails } from './AdvancedFusionDetails'

const AdvancedDetailsFooter = styled.div<{ show: boolean }>`
  padding-top: calc(16px + 2rem);
  padding-bottom: 16px;
  margin-top: -2rem;
  width: 100%;
  max-width: 400px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  color: ${({ theme }) => theme.text2};
  background-color: ${({ theme }) => theme.advancedBG};
  z-index: -1;

  transform: ${({ show }) => (show ? 'translateY(0%)' : 'translateY(-100%)')};
  transition: transform 300ms ease-in-out;
`

export default function AdvancedFusionDetailsDropdown({ swap, price, ...rest }: { swap: any; price: number }) {
  return (
    <AdvancedDetailsFooter show={Boolean(swap)}>
      <AdvancedFusionDetails {...rest} swap={swap} price={price} />
    </AdvancedDetailsFooter>
  )
}
