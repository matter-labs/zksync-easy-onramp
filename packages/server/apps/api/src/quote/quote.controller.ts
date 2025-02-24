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

import { QuoteService, } from "./quote.service";

@ApiTags("quotes",)
@Controller("quotes",)
export class QuoteController {
  constructor(
    private readonly providersQuoteService: ProvidersQuoteService,
    private readonly quoteService: QuoteService,
  ) {}

  @Get()
  @ApiBody({ type: QuoteOptionsDto, },)
  @ApiResponse({ type: QuoteResponseDto, },)
  @UsePipes(new ValidationPipe({ transform: true, },),)
  async getQuotes(@Query() _options: QuoteOptionsDto,): Promise<QuoteResponseDto> {
    const options = await this.providersQuoteService.formatQuoteOptions(_options,);
    const quotes = await this.quoteService.getQuotes(options,);
    return { quotes, };
  }
}
