import { QuoteOptionsDto, QuoteResponseDto, } from "@app/common/quotes";
import { ProvidersQuoteService, } from "@app/providers";
import {
  Controller, Get,
  Query,
  UsePipes,
  ValidationPipe, 
} from "@nestjs/common";
import {
  ApiBody, ApiResponse, ApiTags, 
} from "@nestjs/swagger";

@ApiTags("quotes",)
@Controller("quotes",)
export class QuoteController {
  constructor(
    private readonly providersQuoteService: ProvidersQuoteService,
  ) {}

  @Get()
  @ApiBody({ type: QuoteOptionsDto, },)
  @ApiResponse({ type: QuoteResponseDto, },)
  @UsePipes(new ValidationPipe({ transform: true, },),)
  async getQuotes(@Query() options: QuoteOptionsDto,): Promise<QuoteResponseDto> {
    const quotes = await this.providersQuoteService.getQuotesFromProviders(options,);
    return { quotes, };
  }
}