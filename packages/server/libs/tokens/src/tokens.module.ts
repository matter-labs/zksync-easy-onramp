import { SyncManager, } from "@app/common/services/sync-manager.service";
import { DbModule, } from "@app/db";
import {
  Logger, Module, OnModuleDestroy, OnModuleInit, 
} from "@nestjs/common";
import { ConfigModule, } from "@nestjs/config";

import config from "./config";
import { CoingeckoTokenDataService, } from "./offchain-provider/coingecko-token-data.service";
import { TokensService, } from "./tokens.service";
import { TokensDataSaverService, } from "./tokens-data-saver.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => config,], 
    },),
    DbModule, 
  ],
  providers: [
    Logger,
    SyncManager,
    CoingeckoTokenDataService,
    TokensDataSaverService,
    TokensService,
  ],
  exports: [ TokensDataSaverService, TokensService, ],
},)
export class TokensModule implements OnModuleInit, OnModuleDestroy {
  public constructor(
    private readonly tokenDataSaverService: TokensDataSaverService,
  ) {}

  public onModuleInit() {
    this.startWorkers();
  }

  public onModuleDestroy() {
    this.stopWorkers();
  }

  private startWorkers() {
    const tasks = [this.tokenDataSaverService.start(),];
    return Promise.all(tasks,);
  }

  private stopWorkers() {
    return Promise.all([this.tokenDataSaverService.stop(),],);
  }
}
