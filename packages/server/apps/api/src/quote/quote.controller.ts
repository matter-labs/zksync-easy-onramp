import { Body, Controller, Post, } from "@nestjs/common";
import { ApiBody, ApiResponse, ApiTags, } from "@nestjs/swagger";

import { QuoteOptionsDto, QuoteResponseDto, } from "./quote.dto";
import { QuoteService, } from "./quote.service";

@ApiTags("quotes",)
@Controller("quotes",)
export class QuoteController {
  constructor(private readonly quoteService: QuoteService,) {}

  @Post()
  @ApiBody({ type: QuoteOptionsDto, },)
  @ApiResponse({ type: QuoteResponseDto, },)
  async getQuotes(@Body() options: QuoteOptionsDto,): Promise<QuoteResponseDto> {
    return this.quoteService.getQuotes(options,);
  }
}