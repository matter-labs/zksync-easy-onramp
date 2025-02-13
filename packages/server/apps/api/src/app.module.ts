import { DbModule, } from "@app/db";
import { ProvidersModule, ProvidersUpdateService, } from "@app/providers";
import { TokensModule, } from "@app/tokens";
import { TokenDataSaverService, } from "@app/tokens/token-data-saver.service";
import {
  Logger, MiddlewareConsumer, Module, NestModule,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigModule, } from "@nestjs/config";
import { TerminusModule, } from "@nestjs/terminus";

import config from "./config";
import { HealthController, } from "./health";
import { metricProviders, } from "./metrics/metrics.provider";
import { MetricsMiddleware, } from "./middlewares/metrics.middleware";
import { QuoteController, } from "./quote";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => config,],
    },),
    TerminusModule,

    DbModule,
    TokensModule,
    ProvidersModule,
  ],
  providers: [
    Logger,
    ...metricProviders,
  ],
  controllers: [
    HealthController,
    QuoteController,
  ],
},)
export class AppModule implements NestModule, OnModuleInit, OnModuleDestroy {
  public constructor(
    private readonly tokenDataSaverService: TokenDataSaverService,
    private readonly providersUpdateService: ProvidersUpdateService,
  ) {}
    
  configure(consumer: MiddlewareConsumer,) {
    consumer.apply(MetricsMiddleware,).forRoutes("*",);
  }

  public onModuleInit() {
    this.startWorkers();
  }

  public onModuleDestroy() {
    this.stopWorkers();
  }

  private startWorkers() {
    const tasks = [
      this.tokenDataSaverService.start(),
      this.providersUpdateService.start(),
    ];
    return Promise.allSettled(tasks,);
  }

  private stopWorkers() {
    return Promise.allSettled([
      this.tokenDataSaverService.stop(),
      this.providersUpdateService.stop(),
    ],);
  }
}
