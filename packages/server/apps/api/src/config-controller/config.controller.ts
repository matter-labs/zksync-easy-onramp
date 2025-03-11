import { supportedChains, } from "@app/common/chains";
import { ProvidersRegistry, } from "@app/providers";
import { TokensService, } from "@app/tokens";
import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBody, ApiResponse, ApiTags,
} from "@nestjs/swagger";

import { ConfigOptionsDto, ConfigResponseDto, } from "./config.dto";

@ApiTags("config",)
@Controller("config",)
export class ConfigController {
  constructor(
    private readonly tokensService: TokensService,
    private readonly providersRegistryService: ProvidersRegistry,
  ) {}

  @Get()
  @ApiBody({ type: ConfigOptionsDto, },)
  @ApiResponse({ type: ConfigResponseDto, },)
  @UsePipes(new ValidationPipe({ transform: true, },),)
  async getConfig(@Query() _options: ConfigOptionsDto,): Promise<ConfigResponseDto> {
    const tokens = await this.tokensService.getAll(_options,);
    const chains = supportedChains.map((e,) => ({
      id: e.id,
      name: e.name,
    }),);
    const providers = this.providersRegistryService.providers.map((e,) => e.meta,);

    return {
      tokens,
      chains,
      providers,
    };
  }
}
