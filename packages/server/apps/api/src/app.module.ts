import { DbModule, } from "@app/db";
import { ProvidersModule, ProvidersUpdateService, } from "@app/providers";
import { SwapsModule, } from "@app/swaps";
import { TokensDataSaverService, TokensModule, } from "@app/tokens";
import {
  Logger, MiddlewareConsumer, Module, NestModule,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigModule, } from "@nestjs/config";
import { TerminusModule, } from "@nestjs/terminus";

import config from "./config";
import { ConfigController, } from "./config-controller";
import { HealthController, } from "./health";
import { metricProviders, } from "./metrics/metrics.provider";
import { MetricsMiddleware, } from "./middlewares/metrics.middleware";
import { OrderStatusController, } from "./order-status";
import { QuoteController, QuoteService, } from "./quote";

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
    SwapsModule,
  ],
  providers: [
    Logger,
    ...metricProviders,

    QuoteService,
  ],
  controllers: [
    HealthController,
    QuoteController,
    ConfigController,
    OrderStatusController,
  ],
},)
export class AppModule implements NestModule, OnModuleInit, OnModuleDestroy {
  public constructor(
    private readonly tokenDataSaverService: TokensDataSaverService,
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
