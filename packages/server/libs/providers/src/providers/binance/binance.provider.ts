import {
  ProviderQuoteDto,
  QuoteOptions,
} from "@app/common/quotes";
import {
  QuoteProviderType,
  RouteType,
} from "@app/db/enums";
import {
  ProviderRepository,
  SupportedTokenRepository,
  TokenRepository,
} from "@app/db/repositories";
import { Injectable, } from "@nestjs/common";
import { ConfigService, } from "@nestjs/config";
import crypto from "crypto";
import { $fetch, FetchError, } from "ofetch";
import { getAddress, } from "viem";

import { IProvider, } from "../../provider.interface";
import {
  BinanceQuoteResponse,
  BinanceSupportedNetworkResponse,
} from "./types";

const API_BASE = "https://bpay.binanceapi.com/binancepay/openapi/withdraw";

@Injectable()
export class BinanceProvider implements IProvider {
  readonly meta = {
    key: "binance",
    type: QuoteProviderType.ONRAMP,
    name: "Binance Pay",
    iconUrl: "https://bin.bnbstatic.com/static/images/bnb-for/brand.png",
  };
  private readonly API_ECDSA_PRIVATE_KEY: string;
  private readonly API_SOURCE_KEY: string;

  private isProviderInstalled = false;

  constructor(
    private readonly providerRepository: ProviderRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly supportedTokenRepository: SupportedTokenRepository,
    configService: ConfigService,
  ) {
    this.API_ECDSA_PRIVATE_KEY = configService.get<string>("binance.apiEcdsaPrivateKey",);
    this.API_SOURCE_KEY = configService.get<string>("binance.apiSourceKey",);
    if (!this.API_ECDSA_PRIVATE_KEY || !this.API_SOURCE_KEY) {
      throw new Error("Binance API keys are missing",);
    }
  }

  private async installProvider(): Promise<void> {
    if (this.isProviderInstalled) return;
    await this.providerRepository.findOrCreate(this.meta,);
    this.isProviderInstalled = true;
  }

  async syncRoutes(): Promise<void> {
    await this.installProvider();

    const body = { source: this.API_SOURCE_KEY, };
    const headers = this.getRequestHeaders(body,);

    const response = await $fetch<BinanceSupportedNetworkResponse>(`${API_BASE}/networks`, {
      method: "POST",
      body,
      headers,
    },);

    if (!response.success) {
      throw new Error(`Failed to fetch ${this.meta.key} supported networks. Code: ${response.code}`,);
    }

    const supportedTokens = response.data.coinDetail.flatMap(async (coin,) => {
      return coin.netWorkDetailList
        .filter((network,) => network.withdrawEnable,)
        .map(async (network,) => {
          const token = await this.tokenRepository.findOrCreate({
            address: getAddress(network.contractAddress,),
            chainId: 1, // Needs manual mapping
            symbol: coin.coin,
            name: network.networkName,
            decimals: 18, // Needs manual mapping
          },);

          await this.supportedTokenRepository.upsert({
            providerKey: this.meta.key,
            tokenId: token.id,
            type: RouteType.BUY,
          },);
        },);
    },);

    await Promise.all(supportedTokens,);
  }

  async getQuote(options: QuoteOptions,): Promise<ProviderQuoteDto[]> {
    const token = await this.tokenRepository.findOneBy({ address: getAddress(options.token,), },);

    if (!token) return [];

    const body = {
      source: this.API_SOURCE_KEY,
      currency: token.symbol,
      network: "ETH", // Needs manual mapping
      address: options.to,
    };
    const headers = this.getRequestHeaders(body,);

    const _response = await $fetch<BinanceQuoteResponse>(`${API_BASE}/pre-create`, {
      method: "POST",
      body,
      headers,
    },).catch((error,) => {
      if (error instanceof FetchError) {
        console.warn(`Failed to fetch quote from ${this.meta.key}: ${error.message}`,);
        return { success: false, };
      }
      throw error;
    },);

    if (!_response.success) return [];

    const response = _response as BinanceQuoteResponse;
    const quote: ProviderQuoteDto = {
      type: RouteType.BUY,
      provider: this.meta,
      pay: {
        currency: options.fiatCurrency,
        fiatAmount: parseFloat(options.fiatAmount || "0",),
        totalFeeUsd: 0, // Binance API doesn't expose this directly
      },
      receive: {
        token: {
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
        },
        chain: {
          id: options.chainId,
          name: "Ethereum", // Needs mapping
        },
        to: options.to,
        amountUnits: "0", // Binance API doesn't provide direct conversion
        amountUsd: 0, // Needs conversion logic
      },
      paymentMethods: [], // Binance doesn't specify payment methods directly
      kyc: [], // KYC level unknown from Binance API
      steps: [
        {
          type: "onramp_via_link",
          link: response.data.universalLinkUrl,
        },
      ],
      country: options.country,
    };

    return [quote,];
  }

  private getRequestHeaders(requestBody: unknown,): Record<string, string> {
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16,).toString("hex",); // 32-character random string

    const payload = `${timestamp}\n${nonce}\n${JSON.stringify(requestBody,)}\n`;
    const signature = this.signPayload(payload,);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "BinancePay-Timestamp": timestamp,
      "BinancePay-Nonce": nonce,
      "BinancePay-Signature": signature,
    };

    return headers;
  }
  private signPayload(payload: string,): string {
    const privateKeyPEM = Buffer.from(this.API_ECDSA_PRIVATE_KEY, "base64",).toString("utf-8",);

    const privateKey = crypto.createPrivateKey({
      key: privateKeyPEM,
      format: "pem",
    },);

    const sign = crypto.createSign("SHA256",);
    sign.update(payload,);
    sign.end();

    return sign.sign(privateKey, "base64url",);
  }
}