import { DbModule, } from "@app/db";
import { ProvidersModule, } from "@app/providers";
import {
  Logger, MiddlewareConsumer, Module, NestModule,
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer,) {
    consumer.apply(MetricsMiddleware,).forRoutes("*",);
  }
}
