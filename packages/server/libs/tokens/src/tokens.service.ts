import { Token, } from "@app/db/entities";
import { TokenRepository, } from "@app/db/repositories";
import { Injectable, Logger, } from "@nestjs/common";
import { ConfigOptionsDto, } from "apps/api/src/config-controller/config.dto";
import { FindOptionsWhere, } from "typeorm";

import { TokensDataSaverService, } from "./tokens-data-saver.service";

@Injectable()
export class TokensService {
  protected readonly logger: Logger;

  public constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly tokensDataSaverService: TokensDataSaverService,
  ) {
    this.logger = new Logger(TokensService.name,);
  }

  private async waitForStateReady(): Promise<void> {
    await this.tokensDataSaverService.waitForFirstSync();
  }

  public async findOneBy(where: FindOptionsWhere<Token> | FindOptionsWhere<Token>[],): Promise<Token | null> {
    await this.waitForStateReady();
    return await this.tokenRepository.findOneBy(where,);
  }

  public async getAll(options: ConfigOptionsDto,): Promise<Token[]> {
    await this.waitForStateReady();
    const findOptions = {};
    if (options.tokenSort) {
      findOptions["order"] = { [options.tokenSort]: "DESC", };
    }
    return await this.tokenRepository.find(findOptions,);
  }
}
