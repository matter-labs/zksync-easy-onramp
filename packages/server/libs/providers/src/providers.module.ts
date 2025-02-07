import { DbModule, } from "@app/db";
import { metricProviders, } from "@app/db/metrics";
import { Logger, Module, } from "@nestjs/common";
import { ConfigModule, } from "@nestjs/config";
import { TerminusModule, } from "@nestjs/terminus";

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
    TerminusModule,
    DbModule,
  ],
  providers: [
    Logger,
    ...metricProviders,
    
    KadoProvider,
    ProvidersRegistry,
    ProvidersQuoteService,
    ProvidersUpdateService, 
  ],
  exports: [ ProvidersQuoteService, ProvidersUpdateService, ],
},)
export class ProvidersModule {}
