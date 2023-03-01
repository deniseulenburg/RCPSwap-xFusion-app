import { AutoColumn } from 'components/Column'
import Row, { RowFixed } from 'components/Row'
import { CoinSVG } from 'components/svgs'
import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Text } from 'rebass'

const AdvancedDetailsFooter = styled.div<{ show: boolean }>`
  padding-top: 16px;
  padding-bottom: 16px;
  margin-top: 1rem;
  width: 100%;
  max-width: 400px;
  border-radius: 20px;
  color: ${({ theme }) => theme.text2};
  background-color: ${({ theme }) => theme.advancedBG};
  z-index: -1;

  transform: ${({ show }) => (show ? 'translateY(0%)' : 'translateY(-100%)')};
  transition: transform 300ms ease-in-out;
`

const DexLogo = styled.img`
  width: 18px;
  height: 18px;
  padding: 2px;
  border: 1px solid ${({ theme }) => theme.text4};
  border-radius: 5px;
  margin: 1px 6px 0;
`

export default function AdvancedFusionDetailsDropdown({
  swap,
  price,
  dexes
}: {
  swap: any
  price: number
  dexes: any
}) {
  const theme = useContext(ThemeContext)

  return (
    <AdvancedDetailsFooter show={Boolean(swap)}>
      {swap && swap.type === 0 && (
        <AutoColumn style={{ padding: '0 30px' }}>
          <Row>
            <RowFixed style={{ padding: '10px', borderRadius: '50%', background: theme.bg3 }}>
              <CoinSVG color={theme.text1}></CoinSVG>
            </RowFixed>
            <AutoColumn style={{ marginLeft: '30px' }}>
              <RowFixed>
                <Text fontSize={15} color={theme.green1} fontWeight={600}>
                  {(
                    ((swap?.price ?? 0) - (swap?.maxMultihop?.trade?.outputAmount?.toExact() ?? 0)) *
                    (price === 0 ? 1 : price)
                  ).toFixed(3) +
                    ' ' +
                    (price === 0 ? swap.tokenOut?.symbol : '$')}
                </Text>
                <Text fontSize={14} color={theme.text2} marginLeft={'5px'}>
                  in saving
                </Text>
              </RowFixed>
              <RowFixed>
                <Text fontSize={14} color={theme.text2}>
                  Compared to
                </Text>
                {/* eslint-disable */}
                <DexLogo
                  src={
                    require(`../../assets/dex/${dexes[swap?.maxMultihop?.index ?? 0].name.toLowerCase()}.png`).default
                  }
                ></DexLogo>
                <Text fontSize={14} color={theme.text2}>
                  {dexes[swap?.maxMultihop?.index ?? 0].name}.
                </Text>
              </RowFixed>
            </AutoColumn>
          </Row>
        </AutoColumn>
      )}
    </AdvancedDetailsFooter>
  )
}
