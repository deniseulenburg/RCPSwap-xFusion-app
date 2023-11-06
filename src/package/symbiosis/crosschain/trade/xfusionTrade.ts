import { ChainId, ONE } from '../../constants'
import { Fraction, Percent, Token, TokenAmount } from '../../entities'
import { XFUSION_CHAINS } from '../constants'
import { Router } from '../../../router/Router'
import { XfusionRouter } from '../contracts'
import { SymbiosisTrade, } from './symbiosisTrade'
import { Native, Type, Token as RToken } from '../../../currency'
import { BigNumber } from 'ethers'
import { PoolCode } from '../../../router/pools/PoolCode'
import { MultiRoute, RouteStatus, getBetterRoute } from '../../../tines'
import { DataFetcher } from 'package/router'
import { LiquidityProviders } from 'package/router/liquidity-providers'
import { basisPointsToPercent } from '../utils'
import { routeProcessor3Address } from 'package/route-processor'
import { PublicClient } from 'viem'

export class XfusionTrade implements SymbiosisTrade {
  static isAvailable(chainId: ChainId): boolean {
    return XFUSION_CHAINS.includes(chainId)
  }

  tradeType = 'dex' as const

  public tokenAmountIn: TokenAmount

  public trade!: MultiRoute
  public route!: Token[]
  public amountOut!: TokenAmount
  public amountOutMin!: TokenAmount
  public callData!: string
  public priceImpact!: Percent
  public routerAddress!: string
  public callDataOffset?: number
  private poolsCodeMap?: Map<string, PoolCode>
  private feeAmountOutBN?: BigNumber

  private readonly tokenOut: Token
  private readonly to: string
  private readonly slippage: number
  private readonly inToken: Type
  private readonly outToken: Type
  private readonly router: XfusionRouter

  constructor(tokenAmountIn: TokenAmount, tokenOut: Token, to: string, slippage: number, router: XfusionRouter) {
    this.tokenAmountIn = tokenAmountIn
    this.tokenOut = tokenOut
    this.to = to
    this.slippage = slippage
    this.router = router
    this.routerAddress = router.address

    this.inToken = this.getToken(this.tokenAmountIn.token)
    this.outToken = this.getToken(this.tokenOut)
  }

  public async init() {
    const dataFetcher = DataFetcher.onChain(ChainId.ARBITRUM_NOVA)
    dataFetcher.startDataFetching()
    await dataFetcher.fetchPoolsForToken(this.inToken, this.outToken)
    dataFetcher.stopDataFetching()

    const gasPrice = await this.getGasPrice(dataFetcher.web3Client);

    const poolsCodeMap = await dataFetcher.getCurrentPoolCodeMap(this.inToken, this.outToken)

    this.poolsCodeMap = poolsCodeMap

    const bestRoute = Router.findBestRoute(poolsCodeMap, ChainId.ARBITRUM_NOVA, this.inToken, BigNumber.from(this.tokenAmountIn.raw.toString()), this.outToken, Number(gasPrice.toString()), 100)

    if (bestRoute.status === RouteStatus.NoWay) {
      throw new Error('Cannot create trade')
    }

    const sushiPoolsCodeMap = new Map<string, PoolCode>()

    const sushiFilter = ['USDC', 'WETH', 'WBTC', 'USDT', 'DAI', 'ETH', this.inToken.symbol, this.outToken.symbol]

    Array.from(poolsCodeMap.entries()).forEach(item => {
      if (
        sushiFilter.find(v => v === item[1].pool.token0.symbol) &&
        sushiFilter.find(v => v === item[1].pool.token1.symbol)
      ) {
        sushiPoolsCodeMap.set(item[0], item[1])
      }
    })

    const sushiBestRoute = Router.findBestRoute(
      sushiPoolsCodeMap,
      ChainId.ARBITRUM_NOVA,
      this.inToken,
      BigNumber.from(this.tokenAmountIn.raw.toString()),
      this.outToken,
      Number(gasPrice.toString()),
      100,
      [LiquidityProviders.SushiSwapV2, LiquidityProviders.SushiSwapV3]
    )

    const arbBestRoute = Router.findBestRoute(
      poolsCodeMap,
      ChainId.ARBITRUM_NOVA,
      this.inToken,
      BigNumber.from(this.tokenAmountIn.raw.toString()),
      this.outToken,
      Number(gasPrice.toString()),
      1,
      [LiquidityProviders.ArbSwap]
    )

    const rcpBestRoute = Router.findBestRoute(
      poolsCodeMap,
      ChainId.ARBITRUM_NOVA,
      this.inToken,
      BigNumber.from(this.tokenAmountIn.raw.toString()),
      this.outToken,
      Number(gasPrice.toString()),
      1,
      [LiquidityProviders.RCPSwap]
    )

    const bestSingleProvider = getBetterRoute(sushiBestRoute, getBetterRoute(arbBestRoute, rcpBestRoute))

    this.trade = bestRoute

    this.priceImpact = new Percent(Math.floor(((bestRoute.priceImpact ?? 0) * 10000)).toString(), '10000')
    this.route = [this.tokenAmountIn.token, this.tokenOut]

    const amountOutMin = new TokenAmount(this.tokenOut, new Fraction(ONE).add(basisPointsToPercent(this.slippage)).invert().multiply(bestRoute.amountOutBN.toString()).quotient)

    const xFusionFee = (bestRoute?.amountOutBN ?? BigNumber.from(0)).gte(
      bestSingleProvider?.amountOutBN ?? BigNumber.from(0)
    )
      ? (bestRoute?.amountOutBN ?? BigNumber.from(0))
        .sub(bestSingleProvider?.amountOutBN ?? BigNumber.from(0))
        .mul(3000)
        .div(10000)
      : BigNumber.from(0)

    const feeAmountOutBN = xFusionFee.isZero() ? bestRoute.amountOutBN.mul(100).div(10000) : xFusionFee.add(bestRoute.amountOutBN.mul(30).div(10000))

    this.feeAmountOutBN = feeAmountOutBN

    this.amountOut = new TokenAmount(this.tokenOut, BigInt(bestRoute.amountOutBN.sub(feeAmountOutBN).toString()))

    this.amountOutMin = amountOutMin.subtract(new TokenAmount(this.tokenOut, feeAmountOutBN.toString()))

    const { data, offset } = this.buildCallData();

    this.callData = data
    this.callDataOffset = offset

    return this
  }

  private async getGasPrice(web3Client: PublicClient): Promise<bigint> {
    try {
      return await web3Client.getGasPrice()
    } catch (err) {
      return 10000000n
    }
  }

  private getToken(token: Token): Type {
    this.slippage;
    this.to;
    this.inToken;
    this.outToken;
    this.router;
    if (token.isNative) return Native.onChain(ChainId.ARBITRUM_NOVA)
    return new RToken({
      address: token.address,
      chainId: ChainId.ARBITRUM_NOVA,
      decimals: token.decimals,
      name: token.name,
      symbol: token.symbol
    })
  }

  private buildCallData(): { data: string; offset: number } {
    if (!this.poolsCodeMap) return { data: '0x00', offset: 0 }
    const args = Router.routeProcessor2Params(this.poolsCodeMap, this.trade, this.inToken, this.outToken, this.to, routeProcessor3Address[ChainId.ARBITRUM_NOVA])

    return { data: this.router.interface.encodeFunctionData('processRoute', [args.tokenIn, args.amountIn.toString(), args.tokenOut, '0', this.feeAmountOutBN?.toString() ?? '0', args.to, args.routeCode]), offset: 68 }
  }
}
