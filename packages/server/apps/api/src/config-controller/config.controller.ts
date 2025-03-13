import { supportedChains, } from "@app/common/chains";
import { ProvidersRegistry, } from "@app/providers";
import { TokensService, } from "@app/tokens";
import {
  Controller,
  Get,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ApiResponse, ApiTags, } from "@nestjs/swagger";

import { ConfigResponseDto, } from "./config.dto";

@ApiTags("config",)
@Controller("config",)
export class ConfigController {
  constructor(
    private readonly tokensService: TokensService,
    private readonly providersRegistryService: ProvidersRegistry,
  ) {}

  @Get()
  @ApiResponse({ type: ConfigResponseDto, },)
  @UsePipes(new ValidationPipe({ transform: true, },),)
  async getConfig(): Promise<ConfigResponseDto> {
    const tokens = await this.tokensService.getAll();
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
