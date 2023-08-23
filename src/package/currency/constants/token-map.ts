import { ChainId } from '../../chain'

import { AddressMapper } from '../AddressMapper'
import {
  ARB_ADDRESS,
  DAI_ADDRESS,
  SUSHI_ADDRESS,
  USDC_ADDRESS,
  USDT_ADDRESS,
  WBTC_ADDRESS,
  WETH9_ADDRESS,
  WNATIVE_ADDRESS
} from './token-addresses'

export const TOKEN_MAP = AddressMapper.generate([
  ARB_ADDRESS,
  DAI_ADDRESS,
  USDC_ADDRESS,
  USDT_ADDRESS,
  WETH9_ADDRESS,
  SUSHI_ADDRESS,
  WBTC_ADDRESS
])
