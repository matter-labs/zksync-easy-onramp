import { QuoteOptionsDto, QuoteResponseDto, } from "@app/common/quotes";
import { ProvidersQuoteService, ProvidersUpdateService, } from "@app/providers";
import {
  Body, Controller, Post, 
} from "@nestjs/common";
import {
  ApiBody, ApiResponse, ApiTags, 
} from "@nestjs/swagger";

@ApiTags("quotes",)
@Controller("quotes",)
export class QuoteController {
  constructor(
    private readonly providersQuoteService: ProvidersQuoteService,
    private readonly providersUpdateService: ProvidersUpdateService,
  ) {}

  @Post()
  @ApiBody({ type: QuoteOptionsDto, },)
  @ApiResponse({ type: QuoteResponseDto, },)
  async getQuotes(@Body() options: QuoteOptionsDto,): Promise<QuoteResponseDto> {
    // return { quotes: [], };
    await this.providersUpdateService.syncProviderRoutes(); // TODO: move to cron job
    const quotes = await this.providersQuoteService.getQuotesFromProviders(options,);
    return { quotes, };
  }
}