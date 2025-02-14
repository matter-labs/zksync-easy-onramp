import { supportedFiatCurrencies, } from "@app/common/currencies";
import {
  ProviderQuoteDto, QuoteOptions, QuoteOptionsDto,
} from "@app/common/quotes";
import {
  PaymentMethod, QuoteProviderType, RouteType,
} from "@app/db/enums";
import { TokensService, } from "@app/tokens";
import { BadRequestException,Injectable, } from "@nestjs/common";
import {
  formatUnits, getAddress, parseUnits, 
} from "viem";

import { ProvidersRegistry, } from "./providers-registry.service";
import { ProvidersUpdateService, } from "./providers-update.service";

@Injectable()
export class ProvidersQuoteService {
  constructor(
    private readonly providersRegistry: ProvidersRegistry,
    private readonly providersUpdateService: ProvidersUpdateService,
    private readonly tokens: TokensService,
  ) {}

  private async waitForStateReady(): Promise<void> {
    await this.providersUpdateService.waitForFirstSync();
  }

  async getQuotesFromProviders(_options: QuoteOptionsDto,): Promise<ProviderQuoteDto[]> {
    const options: QuoteOptions = {
      to: _options.to,
      chainId: _options.chainId,
      token: _options.token ? getAddress(_options.token,) : undefined,
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

    const token = await this.tokens.findOneBy({ address: options.token, chainId: options.chainId, },);
    if (!token) throw new BadRequestException("Token not supported",);

    if (options.amount) {
      options.fiatAmount = Number(formatUnits(BigInt(options.amount,), token.decimals,),) * token.usdPrice;
    } else if (options.fiatAmount) {
      options.amount = parseUnits(Math.round(options.fiatAmount / token.usdPrice,).toString(), token.decimals,).toString();
    }

    await this.waitForStateReady();

    // TODO: improve to firstly search for providers that support requested quote (to not call all existing providers)
    const quotes: ProviderQuoteDto[] = (await Promise.all(
      this.providersRegistry.providers.map((provider,) => provider.getQuote(options, token,),),
    )).flat();
    return quotes;
  };
}
