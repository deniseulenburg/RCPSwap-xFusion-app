import { ChainId } from "../chain";
import { Type } from "../currency";
// import { PrismaClient } from "@prisma/client";

import { config } from "../viem";
import { createPublicClient, http, PublicClient } from "viem";

import {
  LiquidityProvider,
  LiquidityProviders,
} from "./liquidity-providers/LiquidityProvider";
import { NativeWrapProvider } from "./liquidity-providers/NativeWrapProvider";
import { SushiSwapV2Provider } from "./liquidity-providers/SushiSwapV2";
import { SushiSwapV3Provider } from "./liquidity-providers/SushiSwapV3";
import type { PoolCode } from "./pools/PoolCode";
import { ArbSwapProvider } from "./liquidity-providers/ArbSwap";
import { RCPSwapProvider } from "./liquidity-providers/RCPSwap";

// import { create } from 'viem'
const isTest =
  process.env["NODE_ENV"] === "test" ||
  process.env["NEXT_PUBLIC_TEST"] === "true";

// Gathers pools info, creates routing in 'incremental' mode
// This means that new routing recalculates each time new pool fetching data comes
export class DataFetcher {
  chainId: ChainId;
  providers: LiquidityProvider[] = [];
  // Provider to poolAddress to PoolCode
  poolCodes: Map<LiquidityProviders, Map<string, PoolCode>> = new Map();
  stateId = 0;
  web3Client: PublicClient;
  // databaseClient: PrismaClient | undefined = undefined;

  // TODO: maybe use an actual map
  // private static cache = new Map<number, DataFetcher>()

  private static cache: Record<number, DataFetcher> = {};

  static onChain(chainId: ChainId): DataFetcher {
    if (chainId in this.cache) {
      return this.cache[chainId];
    }

    this.cache[chainId] = new DataFetcher(chainId);

    return this.cache[chainId];
  }

  constructor(
    chainId: ChainId,
    web3Client?: PublicClient
    // databaseClient?: PrismaClient
  ) {
    this.chainId = chainId;
    if (!web3Client && !config[chainId]) {
      throw new Error(`No viem client or config for chainId ${chainId}`);
    }

    if (web3Client) {
      this.web3Client = web3Client;
    } else {
      this.web3Client = createPublicClient({
        ...config[chainId],
        transport: isTest
          ? http("http://127.0.0.1:8545")
          : config[chainId].transport,
        pollingInterval: 8_000,
        batch: {
          multicall: {
            batchSize: 512,
          },
        },
      });
    }

    // this.databaseClient = databaseClient;
  }

  _providerIsIncluded(
    lp: LiquidityProviders,
    liquidity?: LiquidityProviders[]
  ) {
    if (!liquidity) return true;
    if (lp === LiquidityProviders.NativeWrap) return true;
    return liquidity.some((l) => l === lp);
  }

  // Starts pool data fetching
  startDataFetching(
    providers?: LiquidityProviders[] // all providers if undefined
  ) {
    this.stopDataFetching();
    this.poolCodes = new Map();

    this.providers = [new NativeWrapProvider(this.chainId, this.web3Client)];

    if (this._providerIsIncluded(LiquidityProviders.SushiSwapV2, providers)) {
      try {
        const provider = new SushiSwapV2Provider(
          this.chainId,
          this.web3Client
          // this.databaseClient
        );
        this.providers.push(provider);
      } catch (e: unknown) {
        // console.warn(e.message)
      }
    }

    if (this._providerIsIncluded(LiquidityProviders.SushiSwapV3, providers)) {
      try {
        const provider = new SushiSwapV3Provider(
          this.chainId,
          this.web3Client
          // this.databaseClient
        );
        this.providers.push(provider);
      } catch (e: unknown) {
        // console.warn(e.message)
      }
    }

    if (this._providerIsIncluded(LiquidityProviders.ArbSwap, providers)) {
      try {
        const provider = new ArbSwapProvider(
          this.chainId,
          this.web3Client
          // this.databaseClient
        );
        this.providers.push(provider);
      } catch (e: unknown) {
        // console.warn(e.message)
      }
    }

    if (this._providerIsIncluded(LiquidityProviders.RCPSwap, providers)) {
      try {
        const provider = new RCPSwapProvider(
          this.chainId,
          this.web3Client
          // this.databaseClient
        );
        this.providers.push(provider);
      } catch (e: unknown) {
        // console.warn(e.message)
      }
    }

    // console.log(
    //   `${chainShortName[this.chainId]}/${this.chainId} - Included providers: ${this.providers
    //     .map((p) => p.getType())
    //     .join(', ')}`
    // )
    this.providers.forEach((p) => p.startFetchPoolsData());
  }

  // To stop fetch pool data
  stopDataFetching() {
    this.providers.forEach((p) => p.stopFetchPoolsData());
  }

  async fetchPoolsForToken(
    currency0: Type,
    currency1: Type,
    excludePools?: Set<string>
  ): Promise<void> {
    // ensure that we only fetch the native wrap pools if the token is the native currency and wrapped native currency
    if (currency0.wrapped.equals(currency1.wrapped)) {
      const provider = this.providers.find(
        (p) => p.getType() === LiquidityProviders.NativeWrap
      );
      if (provider) {
        await provider.fetchPoolsForToken(
          currency0.wrapped,
          currency1.wrapped,
          excludePools
        );
      }
    } else {
      const [token0, token1] =
        currency0.wrapped.equals(currency1.wrapped) ||
        currency0.wrapped.sortsBefore(currency1.wrapped)
          ? [currency0.wrapped, currency1.wrapped]
          : [currency1.wrapped, currency0.wrapped];
      await Promise.all(
        this.providers.map((p) =>
          p.fetchPoolsForToken(token0, token1, excludePools)
        )
      );
    }
  }

  getCurrentPoolCodeMap(
    currency0: Type,
    currency1: Type
  ): Map<string, PoolCode> {
    const result: Map<string, PoolCode> = new Map();
    this.providers.forEach((p) => {
      const poolCodes = p.getCurrentPoolList(
        currency0.wrapped,
        currency1.wrapped
      );
      poolCodes.forEach((pc) => result.set(pc.pool.address, pc));
    });

    return result;
  }

  getCurrentPoolCodeList(currency0: Type, currency1: Type): PoolCode[] {
    const pcMap = this.getCurrentPoolCodeMap(
      currency0.wrapped,
      currency1.wrapped
    );
    return Array.from(pcMap.values());
  }

  // returns the last processed by all LP block number
  getLastUpdateBlock(providers?: LiquidityProviders[]): number {
    let lastUpdateBlock: number | undefined;
    this.providers.forEach((p) => {
      if (this._providerIsIncluded(p.getType(), providers)) {
        const last = p.getLastUpdateBlock();
        if (last < 0) return;
        if (lastUpdateBlock === undefined) lastUpdateBlock = last;
        else lastUpdateBlock = Math.min(lastUpdateBlock, last);
      }
    });
    return lastUpdateBlock === undefined ? 0 : lastUpdateBlock;
  }
}
