import { Module, Logger } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

import { UnitOfWorkModule } from "./unitOfWork";
import { DbMetricsService } from "./dbMetrics.service";
import { metricProviders } from "./metrics/metrics.provider";
import config from "./config";
import { typeOrmModuleOptions } from "./typeorm.config";

import * as Entities from "./entities";
import * as Repositories from "./repositories";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [() => config] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async () => ({
        ...typeOrmModuleOptions,
      }),
    }),
    TypeOrmModule.forFeature(Object.values(Entities)),
    UnitOfWorkModule,
  ],
  providers: [Logger, DbMetricsService, ...metricProviders, ...Object.values(Repositories)],
  exports: [TypeOrmModule, ...Object.values(Repositories)],
})
export class DbModule {}
