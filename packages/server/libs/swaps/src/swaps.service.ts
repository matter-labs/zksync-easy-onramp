import {
  ChainId, createConfig, getQuote,
} from "@lifi/sdk";
import { Injectable, } from "@nestjs/common";
import { ConfigService, } from "@nestjs/config";
import { Memoize, } from "typescript-memoize";
import { Address, } from "viem";

@Injectable()
export class SwapsService {
  constructor(configService: ConfigService,) {
    const apiKey = configService.get<string | undefined>("lifiApiKey",);
    createConfig({ integrator: "zksync-easy-onramp", apiKey, },);
  }

  private isChainIdSupported = (chainId: number,) => {
    return Object.values(ChainId,).includes(chainId as ChainId,);
  };

  @Memoize({
    expiring: 60_000,
    hashFunction: (options,) => JSON.stringify(options,),
  },)
  async getQuote(
    options: {
      fromChainId: number,
      toChainId: number,
      fromToken: Address,
      toToken: Address,
      fromAddress: Address,
      toAddress: Address,
      fromAmount: string,
    },
  ) {
    if (
      !this.isChainIdSupported(options.fromChainId,)
      || !this.isChainIdSupported(options.toChainId,)
    ) return null;
    const quote = await getQuote({
      fromChain: options.fromChainId as ChainId,
      toChain: options.toChainId as ChainId,
      fromToken: options.fromToken,
      toToken: options.toToken,
      fromAddress: options.fromAddress,
      toAddress: options.toAddress,
      fromAmount: options.fromAmount,
    },);
    return quote;
  }
}
