import { SyncManager, } from "@app/common/services/sync-manager.service";
import { DbModule, } from "@app/db";
import {
  Logger, Module, OnModuleDestroy, OnModuleInit, 
} from "@nestjs/common";
import { ConfigModule, } from "@nestjs/config";

import config from "./config";
import { CoingeckoTokenDataService, } from "./provider/coingecko-token-data.service";
import { TokenDataSaverService, } from "./token-data-saver.service";

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
    TokenDataSaverService, 
  ],
  exports: [TokenDataSaverService,],
},)
export class TokensModule implements OnModuleInit, OnModuleDestroy {
  public constructor(
    private readonly tokenDataSaverService: TokenDataSaverService,
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
