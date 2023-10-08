import { AutoColumn } from 'components/Column'
import Row, { RowFixed } from 'components/Row'
import { CoinSVG } from 'components/svgs'
import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Text } from 'rebass'
import { XFusionSwapType } from 'state/swap/hooks'
import { ChainId, Currency, Token, TokenAmount } from '@rcpswap/sdk'
import { ethers } from 'ethers'
import usePrice from 'hooks/usePrice'
import { wrappedCurrency } from 'utils/wrappedCurrency'

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
  currency
}: {
  swap: XFusionSwapType
  currency: Currency | undefined
}) {
  const theme = useContext(ThemeContext)
  const { data: price, isInitialLoading: isLoading } = usePrice(
    wrappedCurrency(currency, ChainId.ARBITRUM_NOVA)?.address
  )

  const saving =
    swap &&
    swap?.result &&
    swap.result?.route &&
    swap.result.route?.amountOut &&
    swap.currencies?.OUTPUT &&
    swap.result.route.fee?.amountOutBN
      ? parseFloat(
          new TokenAmount(
            swap.currencies?.OUTPUT as Token,
            ethers.BigNumber.from(swap.result.route.amountOutBN ?? '0').toString()
          ).toExact()
        ) -
        parseFloat(
          new TokenAmount(
            swap.currencies?.OUTPUT as Token,
            ethers.BigNumber.from(swap.result.route.fee.amountOutBN ?? '0').toString()
          ).toExact()
        ) -
        parseFloat(
          new TokenAmount(
            swap.currencies.OUTPUT as Token,
            ethers.BigNumber.from(swap.result.route.singleProviderRoute?.amountOutBN ?? '0').toString()
          ).toExact()
        )
      : 0

  return swap.result?.route?.fee?.isFusion && saving > 0 ? (
    <AdvancedDetailsFooter show={Boolean(swap && swap?.result && swap?.result?.route)}>
      {swap &&
        swap?.result &&
        swap.result?.route &&
        swap.result.route?.amountOut &&
        swap.currencies?.OUTPUT &&
        saving > 0 && (
          <AutoColumn style={{ padding: '0 30px' }}>
            <Row>
              <RowFixed style={{ padding: '10px', borderRadius: '50%', background: theme.bg3 }}>
                <CoinSVG color={theme.text1}></CoinSVG>
              </RowFixed>
              <AutoColumn style={{ marginLeft: '30px' }}>
                <RowFixed>
                  <Text fontSize={15} color={theme.green1} fontWeight={600}>
                    {(saving * (isLoading || !price || price.equalTo('0') ? 1 : parseFloat(price.toFixed(6)))).toFixed(
                      3
                    ) +
                      ' ' +
                      (isLoading || !price || price.equalTo('0') ? swap?.currencies?.OUTPUT?.symbol : '$')}
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
                      require(`../../assets/dex/${swap.result.route.singleProviderRoute?.provider?.toLowerCase() ??
                        'rcp'}swap.png`).default
                    }
                  ></DexLogo>
                  <Text fontSize={14} color={theme.text2}>
                    {swap.result.route.singleProviderRoute?.provider ?? 'RCP'}Swap.
                  </Text>
                </RowFixed>
              </AutoColumn>
            </Row>
          </AutoColumn>
        )}
    </AdvancedDetailsFooter>
  ) : null
}
