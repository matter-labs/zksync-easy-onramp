import { SupportedChainId, } from "@app/common/chains";
import { Token, } from "@app/db/entities";
import { Injectable, Logger, } from "@nestjs/common";
import { ConfigService, } from "@nestjs/config";
import { $fetch, type FetchError, } from "ofetch";
import { setTimeout, } from "timers/promises";
import { Address, getAddress, } from "viem";
import { mainnet, zksync, } from "viem/chains";
import { l2BaseTokenAddress, legacyEthAddress, } from "viem/zksync";

const API_NUMBER_OF_TOKENS_PER_REQUEST = 250;
const API_INITIAL_RETRY_TIMEOUT = 5000;
const API_RETRY_ATTEMPTS = 5;

export type TokenOffchainData = Omit<Token, "id" | "createdAt" | "updatedAt" | "decimals" | "name"> & { name?: string };
type TokenPlatforms = Record<string, Address>;
interface ITokenListItemProviderResponse {
  id: string;
  platforms: TokenPlatforms;
}
interface ITokenMarketDataProviderResponse {
  id: string;
  symbol: string;
  name?: string;
  image?: string;
  current_price?: number;
  market_cap?: number;
  market_cap_rank?: number;
}

type FormattedPlatforms = Record<SupportedChainId, Address>;

class ProviderResponseError extends Error {
  constructor(message: string, public readonly status: number, public readonly rateLimitResetDate?: Date,) {
    super(message,);
  }
}

// TODO: cleanup after dev testing
const ChainIdToCoingeckoPlatform: Record<SupportedChainId, string> = { [zksync.id]: "zksync", [mainnet.id]: "ethereum", };

const getChainIdFromPlatform = (platform: string,): SupportedChainId | null => {
  const chainId = Object.entries(ChainIdToCoingeckoPlatform,)
    .find(([ , value, ],) => value === platform,)?.[0];
  if (!chainId) return null;
  return parseInt(chainId,) as SupportedChainId;
};

const hasValidPlatforms = (platforms: TokenPlatforms,): boolean => {
  return Object.values(ChainIdToCoingeckoPlatform,).some((platform,) => platform in platforms,);
};

const formatPlatformsByChainId = (platforms: TokenPlatforms,): FormattedPlatforms => {
  return Object.entries(platforms,).reduce((acc, [ platform, _address, ],) => {
    if (!_address) return acc;

    let address: Address | null = null;
    try {
      address = getAddress(
        _address.substring(0, 42,).toLowerCase(),
      );
    } catch {
      return acc;
    }

    const chainId = getChainIdFromPlatform(platform,);
    if (!chainId) return acc;

    acc[chainId] = address;
    return acc;
  }, {} as FormattedPlatforms,);
};

@Injectable()
export class CoingeckoTokenDataService {
  private readonly logger: Logger;
  private readonly isProPlan: boolean;
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(configService: ConfigService,) {
    this.logger = new Logger(CoingeckoTokenDataService.name,);
    this.isProPlan = configService.get<boolean>("coingecko.isProPlan",);
    this.apiKey = configService.get<string>("coingecko.apiKey",);
    this.apiUrl = this.isProPlan ? "https://pro-api.coingecko.com/api/v3" : "https://api.coingecko.com/api/v3";
  }

  public async getTokensOffChainData(): Promise<TokenOffchainData[]> {
    const tokensList = await this.getTokensList();
    const supportedTokens = tokensList.filter(
      (token,) => token.id === "ethereum" || hasValidPlatforms(token.platforms,),
    );

    const tokensOffChainData: TokenOffchainData[] = [];
    let tokenIdsPerRequest = [];
    for (let i = 0; i < supportedTokens.length; i++) {
      tokenIdsPerRequest.push(supportedTokens[i].id,);
      if (tokenIdsPerRequest.length === API_NUMBER_OF_TOKENS_PER_REQUEST || i === supportedTokens.length - 1) {
        const tokensMarkedData = await this.getTokensMarketData(tokenIdsPerRequest,);
        tokensMarkedData.forEach((token,) => {
          if (!token.market_cap || !token.current_price) return;
          const { addressesByChainId, } = supportedTokens.find((t,) => t.id === token.id,);
          Object.entries(addressesByChainId,)
            .forEach(([ _chainId, address, ],) => {
              const chainId = parseInt(_chainId,) as SupportedChainId;
              tokensOffChainData.push({
                chainId,
                address,
                symbol: token.symbol.toUpperCase(),
                name: token.name,
                marketCap: token.market_cap,
                usdPrice: token.current_price,
                iconUrl: token.image,
              },);
            },);
        },);
        tokenIdsPerRequest = [];
      }
    }
    return tokensOffChainData;
  }

  private getTokensMarketData(tokenIds: string[],) {
    return this.makeApiRequestRetryable<ITokenMarketDataProviderResponse[]>({
      path: "/coins/markets",
      query: {
        vs_currency: "usd",
        ids: tokenIds.join(",",),
        per_page: tokenIds.length.toString(),
        page: "1",
        locale: "en",
      },
    },);
  }

  private async getTokensList() {
    const list = await this.makeApiRequestRetryable<ITokenListItemProviderResponse[]>({
      path: "/coins/list",
      query: { include_platform: "true", },
    },);
    if (!list) {
      return [];
    }
    return list
      .map((item,) => {
        if (item.id === "ethereum") {
          return {
            ...item,
            platforms: {
              ethereum: legacyEthAddress,
              zksync: l2BaseTokenAddress,
              ...item.platforms,
            },
          };
        }
        return item;
      },)
      .filter((item,) => hasValidPlatforms(item.platforms,),)
      .map((item,) => ({
        ...item,
        addressesByChainId: formatPlatformsByChainId(item.platforms,),
      }),);
  }

  private async makeApiRequestRetryable<T,>({
    path,
    query,
    retryAttempt = 0,
    retryTimeout = API_INITIAL_RETRY_TIMEOUT,
  }: {
    path: string;
    query?: Record<string, string>;
    retryAttempt?: number;
    retryTimeout?: number;
  },): Promise<T> {
    try {
      return await this.makeApiRequest<T>(path, query,);
    } catch (err) {
      if (err.status === 404) {
        return null;
      }
      if (err.status === 429) {
        const rateLimitResetIn = err.rateLimitResetDate.getTime() - new Date().getTime();
        await setTimeout(rateLimitResetIn >= 0 ? rateLimitResetIn + 1000 : 0,);
        return this.makeApiRequestRetryable<T>({
          path,
          query,
        },);
      }
      if (retryAttempt >= API_RETRY_ATTEMPTS) {
        this.logger.error({
          message: `Failed to fetch data at ${path} from coingecko after ${retryAttempt} retries`,
          provider: CoingeckoTokenDataService.name,
        },);
        return null;
      }
      await setTimeout(retryTimeout,);
      return this.makeApiRequestRetryable<T>({
        path,
        query,
        retryAttempt: retryAttempt + 1,
        retryTimeout: retryTimeout * 2,
      },);
    }
  }

  private async makeApiRequest<T,>(path: string, query?: Record<string, string>,): Promise<T> {
    const queryString = new URLSearchParams({
      ...query,
      ...(this.isProPlan
        ? { x_cg_pro_api_key: this.apiKey, }
        : { x_cg_demo_api_key: this.apiKey, }),
    },).toString();

    const response = await $fetch<T>(`${this.apiUrl}${path}?${queryString}`,)
      .catch((error: FetchError,) => {
        if (error.response?.status === 429) {
          const rateLimitReset = error.response.headers["x-ratelimit-reset"];
          // use specified reset date or 60 seconds by default
          const rateLimitResetDate = rateLimitReset
            ? new Date(rateLimitReset,)
            : new Date(new Date().getTime() + 60000,);
          this.logger.debug({
            message: `Reached coingecko rate limit, reset at ${rateLimitResetDate}`,
            stack: error.stack,
            status: error.response.status,
            response: error.data,
            provider: CoingeckoTokenDataService.name,
          },);
          throw new ProviderResponseError(error.message, error.response.status, rateLimitResetDate,);
        }
        this.logger.error({
          message: `Failed to fetch data at ${path} from coingecko`,
          stack: error.stack,
          status: error.response?.status,
          response: error.data,
          provider: CoingeckoTokenDataService.name,
        },);
        throw new ProviderResponseError(error.message, error.response?.status,);
      },);
    return response;
  }
}
