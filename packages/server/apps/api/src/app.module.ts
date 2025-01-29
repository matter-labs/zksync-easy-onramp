import { Module, MiddlewareConsumer, NestModule, Logger } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TerminusModule } from "@nestjs/terminus";

import { DbModule } from "@app/db";

import config from "./config";
import { MetricsMiddleware } from "./middlewares/metrics.middleware";
import { metricProviders } from "./metrics/metrics.provider";
import { HealthController } from "./health";
import { QuoteController, QuoteService } from "./quote";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [() => config] }),
    TerminusModule,

    DbModule,
  ],
  providers: [
    Logger,
    ...metricProviders,

    QuoteService,
  ],
  controllers: [
    HealthController,
    QuoteController,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes("*");
  }
}
