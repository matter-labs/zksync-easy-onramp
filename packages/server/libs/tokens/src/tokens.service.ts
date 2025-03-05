import { Token, } from "@app/db/entities";
import { TokenRepository, } from "@app/db/repositories";
import { Injectable, Logger, } from "@nestjs/common";
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

  public async getAll(): Promise<Token[]> {
    await this.waitForStateReady();
    return await this.tokenRepository.find({},);
  }
}