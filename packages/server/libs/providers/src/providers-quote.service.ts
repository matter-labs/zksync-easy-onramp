import { supportedFiatCurrencies, } from "@app/common/currencies";
import {
  ProviderQuoteDto, QuoteOptions, QuoteOptionsDto,
} from "@app/common/quotes";
import {
  PaymentMethod, QuoteProviderType, RouteType,
} from "@app/db/enums";
import { BadRequestException,Injectable, } from "@nestjs/common";

import { ProvidersRegistry, } from "./providers-registry.service";

@Injectable()
export class ProvidersQuoteService {
  constructor(
    private readonly providersRegistry: ProvidersRegistry,
  ) {}

  async getQuotesFromProviders(_options: QuoteOptionsDto,): Promise<ProviderQuoteDto[]> {
    const options: QuoteOptions = {
      to: _options.to,
      chainId: _options.chainId,
      token: _options.token,
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
    if (options.amount) {
      // TODO: support tokenAmount
      throw new BadRequestException("Getting quotes by tokenAmount is not supported at the moment. Use fiatAmount instead",);
    }
    if (options.routeType !== RouteType.BUY) {
      // TODO: support SELL route type
      throw new BadRequestException("Only BUY route type is supported at the moment",);
    }

    // TODO: improve to firstly search for providers that support requested quote (to not call all existing providers)
    const quotes: ProviderQuoteDto[] = (await Promise.all(
      this.providersRegistry.providers.map((provider,) => provider.getQuote(options,),),
    )).flat();
    return quotes;
  };
}
