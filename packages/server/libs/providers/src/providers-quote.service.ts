import { supportedFiatCurrencies, } from "@app/common/currencies";
import {
  ProviderQuoteDto, QuoteOptions, QuoteOptionsDto,
} from "@app/common/quotes";
import {
  PaymentMethod, QuoteProviderType, RouteType,
} from "@app/db/enums";
import { TokensService, } from "@app/tokens";
import { getFiatTokenAmount, getTokenAmountFromFiat, } from "@app/tokens/utils";
import { BadRequestException,Injectable, } from "@nestjs/common";
import { getAddress, } from "viem";

import { ProvidersRegistry, } from "./providers-registry.service";
import { ProvidersUpdateService, } from "./providers-update.service";

@Injectable()
export class ProvidersQuoteService {
  constructor(
    private readonly providersRegistry: ProvidersRegistry,
    private readonly providersUpdateService: ProvidersUpdateService,
    private readonly tokens: TokensService,
  ) {}

  public async waitForStateReady(): Promise<void> {
    await this.providersUpdateService.waitForFirstSync();
  }

  public async formatQuoteOptions(_options: QuoteOptionsDto,): Promise<QuoteOptions> {
    const options: Omit<QuoteOptions, "token"> = {
      to: _options.to,
      chainId: _options.chainId,
      amount: _options.amount,
      fiatAmount: _options.fiatAmount,
      fiatCurrency: _options.fiatCurrency || Object.values(supportedFiatCurrencies,)[0],
      providerTypes: _options.providerTypes || Object.values(QuoteProviderType,),
      paymentMethods: _options.paymentMethods || Object.values(PaymentMethod,),
      routeType: _options.routeType || RouteType.BUY,
      country: _options.country,
      dev: _options.dev,
    };

    if (!options.fiatAmount && !options.amount) {
      throw new BadRequestException("Either amount or fiatAmount must be provided",);
    }
    if (options.fiatAmount && options.amount) {
      throw new BadRequestException("Only one of amount or fiatAmount can be provided",);
    }
    if (options.routeType !== RouteType.BUY) {
      // TODO: support SELL route type
      throw new BadRequestException("Only BUY route type is supported at the moment",);
    }

    const token = await this.tokens.findOneBy({
      address: getAddress(_options.token.toLowerCase(),),
      chainId: options.chainId,
    },);
    if (!token) throw new BadRequestException("Token not supported",);

    if (options.amount) {
      options.fiatAmount = getFiatTokenAmount(options.amount, { decimals: token.decimals, price: token.usdPrice, },);
    } else if (options.fiatAmount) {
      options.amount = getTokenAmountFromFiat(options.fiatAmount, { decimals: token.decimals, price: token.usdPrice, },);
    }

    return {
      ...options,
      token,
    };
  }

  async getProviderQuote(providerKey: string, options: QuoteOptions,): Promise<ProviderQuoteDto | null> {
    await this.waitForStateReady();

    const provider = this.providersRegistry.providers.find((e,) => e.meta.key === providerKey,);
    if (!provider) throw new BadRequestException("Provider not found",);

    const quote = await provider.getQuote(options,);
    return quote;
  }
}
