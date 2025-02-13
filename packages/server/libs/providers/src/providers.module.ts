import { SyncManager, } from "@app/common/services/sync-manager.service";
import { DbModule, } from "@app/db";
import { Logger, Module, } from "@nestjs/common";
import { ConfigModule, } from "@nestjs/config";

import config from "./config";
import { KadoProvider, } from "./providers/kado";
import { ProvidersQuoteService, } from "./providers-quote.service";
import { ProvidersRegistry, } from "./providers-registry.service";
import { ProvidersUpdateService, } from "./providers-update.service";

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
    
    KadoProvider,
    ProvidersRegistry,
    ProvidersQuoteService,
    ProvidersUpdateService, 
  ],
  exports: [ ProvidersQuoteService, ProvidersUpdateService, ],
},)
export class ProvidersModule {}
