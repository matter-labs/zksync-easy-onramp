import { getChainById, } from "@app/common/chains";
import { SyncManager, } from "@app/common/services/sync-manager.service";
import { areObjectFieldsEqual, isNativeTokenAddress, } from "@app/common/utils/helpers";
import { processInBatches, } from "@app/common/utils/processInBatch";
import { waitFor, } from "@app/common/utils/waitFor";
import { Worker, } from "@app/common/utils/worker";
import { Token, } from "@app/db/entities";
import { TokenRepository, } from "@app/db/repositories";
import { Injectable, Logger, } from "@nestjs/common";
import { ConfigService, } from "@nestjs/config";
import {
  type Address,
  createPublicClient, erc20Abi, http,
} from "viem";

import { CoingeckoTokenDataService, type TokenOffchainData, } from "./provider/coingecko-token-data.service";
import { formatMulticallError, } from "./utils";

const MULTICALL_BATCH_SIZE = 50;
const UPDATE_TOKENS_BATCH_SIZE = 100;
const SYNC_KEY = "token_offchain_sync";
const RETRY_DELAY = 30_000;

type TokenDataFull = Omit<Token, "id" | "createdAt" | "updatedAt">;
type TokenKey = `${number}-${string}`;
const getTokenKey = (token: { chainId: number; address: Address },) => `${token.chainId}-${token.address}` as TokenKey;
type MulticallResult = ({
  error?: undefined;
  result: unknown;
  status: "success";
} | {
  error: Error;
  result?: undefined;
  status: "failure";
});

@Injectable()
export class TokenDataSaverService extends Worker {
  private readonly updateTokenOffChainDataInterval: number;
  private readonly logger: Logger;

  public constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly tokenOffChainDataProvider: CoingeckoTokenDataService,
    private readonly syncManager: SyncManager,
    configService: ConfigService,
  ) {
    super();
    this.updateTokenOffChainDataInterval = configService.get<number>("updateTokenOffChainDataInterval",);
    this.logger = new Logger(TokenDataSaverService.name,);
  }

  protected async runProcess(): Promise<void> {
    let nextRunDelay = this.updateTokenOffChainDataInterval;

    try {
      const shouldUpdate = await this.syncManager.shouldSync(SYNC_KEY, this.updateTokenOffChainDataInterval,);
      if (shouldUpdate) {
        await this.syncTokenData();
      } else {
        this.logger.log("Skipping tokens data update, already up-to-date.",);
      }
    } catch (err) {
      this.logger.error(`Failed to update tokens offchain data. Retrying in ${RETRY_DELAY / 1000} seconds. Error: ${err}`,);
      nextRunDelay = RETRY_DELAY;
    }

    // Wait for next execution
    this.logger.log(`Next tokens data update in ${nextRunDelay / 1000} seconds.`,);
    await waitFor(() => !this.currentProcessPromise, nextRunDelay,);
    if (!this.currentProcessPromise) return;

    return this.runProcess();
  }

  /**
   * Main logic for syncing token data.
   */
  private async syncTokenData(): Promise<void> {
    this.logger.log("Fetching tokens data from CoinGecko...",);
    const tokensFromAPI = await this.tokenOffChainDataProvider.getTokensOffChainData();
    const dataFetchTime = new Date();
    this.logger.debug(`Fetched ${tokensFromAPI.length} tokens from CoinGecko at ${dataFetchTime.toISOString()}`,);

    // Fetch existing tokens from DB
    const existingTokens = await this.tokenRepository.find({},);
    this.logger.debug(`Fetched ${existingTokens.length} tokens from DB`,);
    const existingTokenMap = new Map(existingTokens.map((t,) => [ getTokenKey(t,), t, ],),);

    // Track which tokens need additional onchain data
    const newTokens: TokenOffchainData[] = [];
    const tokensToUpdate: Token[] = [];
    const tokensToDelete = existingTokens.filter(
      (token,) => !tokensFromAPI.some((t,) => t.address === token.address && t.chainId === token.chainId,),
    );

    // Identify tokens to add or update
    for (const token of tokensFromAPI) {
      const key = getTokenKey(token,);
      const chain = getChainById(token.chainId,);
      if (!chain) continue;

      if (existingTokenMap.has(key,)) {
        const existingToken = existingTokenMap.get(key,);
        if (!areObjectFieldsEqual(token, existingToken,)) {
          tokensToUpdate.push({ ...existingToken, ...token, },);
        }
      } else {
        newTokens.push(token,);
      }
    }

    this.logger.log(`New Tokens: ${newTokens.length}, Updating: ${tokensToUpdate.length}, Deleting: ${tokensToDelete.length}`,);

    const tokensToAdd: TokenDataFull[] = await this.fetchFullTokenInfo(newTokens,);
    await this.batchUpdateTokens(
      tokensToAdd,
      tokensToUpdate,
      tokensToDelete.map((t,) => t.id,),
    );

    await this.syncManager.markSynced(SYNC_KEY, dataFetchTime,);
    this.logger.log("Token data sync completed.",);
  }

  /**
   * Fetches full onchain data for tokens
   */
  private async fetchFullTokenInfo(tokens: TokenOffchainData[],): Promise<TokenDataFull[]> {
    const tokensByChain: Record<number, TokenOffchainData[]> = {};
    for (const token of tokens) {
      if (!tokensByChain[token.chainId]) {
        tokensByChain[token.chainId] = [];
      }
      tokensByChain[token.chainId].push(token,);
    }

    const tokensFullInfo: TokenDataFull[] = [];
    const seenTokens = new Map<TokenKey, boolean>();

    for (const _chainId in tokensByChain) {
      const chainId = parseInt(_chainId,);
      const chain = getChainById(chainId,);
      const publicClient = createPublicClient({ chain, transport: http(), },);

      const tokens = tokensByChain[chainId].filter((token,) => {
        if (isNativeTokenAddress(token.address,)) {
          const key = getTokenKey(token,);
          if (!seenTokens.has(key,)) {
            tokensFullInfo.push({
              ...token,
              symbol: chain.nativeCurrency.symbol,
              name: chain.nativeCurrency.name,
              decimals: chain.nativeCurrency.decimals,
            },);
            seenTokens.set(key, true,);
          }
          return false;
        }
        return true;
      },);

      if (!tokens.length) continue;

      /**
       * Creates multicall requests for a given token.
       */
      const createMulticallRequests = (address: Address,) => {
        return [
          {
            address, abi: erc20Abi, functionName: "decimals",
          },
          {
            address, abi: erc20Abi, functionName: "symbol",
          },
          {
            address, abi: erc20Abi, functionName: "name",
          },
        ] as const;
      };
      
      /**
       * Parses and validates multicall results.
       */
      const parseMulticallResults = (results: MulticallResult[], index: number, token: TokenOffchainData,) => {
        const multicallFunctionNames = createMulticallRequests("0x",).map((e,) => e.functionName,);
        const extractResult = (functionName: (typeof multicallFunctionNames)[number],) => {
          const totalResultsByAddress = multicallFunctionNames.length;
          const resultOrderIndex = multicallFunctionNames.indexOf(functionName,);
          const result = results[index * totalResultsByAddress + resultOrderIndex];
          return result;
        };

        const decimalResult = extractResult("decimals",);
        const symbolResult = extractResult("symbol",);
        const nameResult = extractResult("name",);
      
        const symbol = validateMulticallResult<string>(symbolResult, "string", "symbol", token,);
        const decimals = validateMulticallResult<number>(decimalResult, "number", "decimals", token,);
        const name = validateMulticallResult<string>(nameResult, "string", "name", token,);
      
        return {
          symbol: symbol ?? null,
          decimals: decimals ?? null,
          name: name ?? null,
        };
      };
      
      /**
       * Validates a multicall result and logs errors if needed.
       */
      const validateMulticallResult = <T,>(
        result: MulticallResult,
        expectedType: "string" | "number",
        field: string,
        token: TokenOffchainData,
      ): T | null => {
        if (result.status !== "success") {
          logMulticallError(new Error(`Multicall failed with reason: ${result.error}`,), field, token,);
          return null;
        }
      
        const value = result.result as T;
        if (typeof value !== expectedType) {
          logMulticallError(new Error(`Invalid type. Expected "${expectedType}", got "${typeof value}"`,), field, token,);
          return null;
        }

        return value;
      };
      
      /**
       * Logs errors from a multicall response.
       */
      const logMulticallError = (error: Error, field: string, token: TokenOffchainData,) => {
        if (error.message.includes("Sanctioned",)) return;
        this.logger.warn(
          `Failed to fetch "${field}" for "${token.address}" on chain "${publicClient.chain.name}". Error: ${formatMulticallError(error,)}`,
        );
      };

      await processInBatches(tokens, MULTICALL_BATCH_SIZE, async (batch,) => {
        const calls = batch.flatMap((token,) => createMulticallRequests(token.address,),);
      
        try {
          const results = await publicClient.multicall({ contracts: calls, } as any,);
      
          outerloop: for (let i = 0; i < batch.length; i++) {
            const token = batch[i];
            const key = getTokenKey(token,);
      
            const tokenOnchainDataResult = parseMulticallResults(results, i, token,);
            const requiredFields: (keyof typeof tokenOnchainDataResult)[] = ["decimals",];
            for(const field of requiredFields) {
              if (tokenOnchainDataResult[field] === null) {
                this.logger.warn(`Skipping token at "${token.address}" on chain "${publicClient.chain.name}" due to missing field "${field}".`,);
                continue outerloop;
              }
            }
      
            if (!seenTokens.has(key,)) {
              tokensFullInfo.push({
                ...token,
                symbol: tokenOnchainDataResult.symbol || token.symbol,
                decimals: tokenOnchainDataResult.decimals,
                name: tokenOnchainDataResult.name || token.name || tokenOnchainDataResult.symbol,
              },);
              seenTokens.set(key, true,);
            }
          }
        } catch (error) {
          this.logger.error(`Multicall failed for chain ${publicClient.chain.name}. Error: ${error}`,);
        }
      },);
    }

    return tokensFullInfo;
  }

  /**
   * Performs batch operations to update the token repository
   */
  private async batchUpdateTokens(
    tokensToAdd: TokenDataFull[],
    tokensToUpdate: Token[],
    tokensToDelete: number[],
  ) {
    if (tokensToAdd.length) {
      await processInBatches(tokensToAdd, UPDATE_TOKENS_BATCH_SIZE, async (batch,) => {
        await this.tokenRepository.addMany(batch,);
      },);
    }

    if (tokensToUpdate.length) {
      await processInBatches(tokensToUpdate, UPDATE_TOKENS_BATCH_SIZE, async (batch,) => {
        await Promise.all(
          batch.map((token,) => this.tokenRepository.update(token.id, token,),),
        );
      },);
    }

    if (tokensToDelete.length) {
      await processInBatches(tokensToDelete, UPDATE_TOKENS_BATCH_SIZE, async (batch,) => {
        const qb = this.tokenRepository.createQueryBuilder("token",);
        await qb
          .delete()
          .where("token.id IN (:...ids)", { ids: batch, },)
          .execute();
      },);
    }
  }
}