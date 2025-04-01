import { supportedChains, } from "@app/common/chains";
import { supportedFiatCurrencies, } from "@app/common/currencies";
import { SupportedTokenRepository, } from "@app/db/repositories";
import { ProvidersRegistry, } from "@app/providers";
import { TokensService, } from "@app/tokens";
import { mapTokenPublicData, } from "@app/tokens/utils";
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
    private readonly supportedTokenRepository: SupportedTokenRepository,
  ) {}

  @Get()
  @ApiResponse({ type: ConfigResponseDto, },)
  @UsePipes(new ValidationPipe({ transform: true, },),)
  async getConfig(): Promise<ConfigResponseDto> {
    const [ tokens, supportedTokens, ] = await Promise.all([
      this.tokensService.getAll(),
      this.supportedTokenRepository.find({ relations: ["token",], },),
    ],);
    const chains = supportedChains.map((e,) => ({
      id: e.id,
      name: e.name,
    }),);
    const providers = this.providersRegistryService.providers.map((e,) => e.meta,);
    const fiatCurrencies = supportedFiatCurrencies;

    const providersWithTokens = providers.map((provider,) => {
      const providerTokens = supportedTokens.filter((e,) => e.providerKey === provider.key,);
      return {
        ...provider,
        tokens: providerTokens.map((e,) => ({
          type: e.type,
          token: mapTokenPublicData(e.token,),
        }),),
      };
    },);

    return {
      tokens: tokens.map(mapTokenPublicData,),
      fiatCurrencies,
      chains,
      providers: providersWithTokens,
    };
  }
}
