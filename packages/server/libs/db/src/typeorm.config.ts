import type { TypeOrmModuleOptions, } from "@nestjs/typeorm";
import type { DataSourceOptions, } from "typeorm";
import { DataSource, } from "typeorm";

import config from "./config";
import * as Entities from "./entities";

const MAX_NUMBER_OF_REPLICA = 100;

const replicaSet = [];
const master = { url: config.db.url, };

for (let i = 0; i < MAX_NUMBER_OF_REPLICA; i++) {
  const replicaURL = process.env[`DB_REPLICA_URL_${i}`];
  if (!replicaURL) {
    break;
  }
  replicaSet.push({ url: replicaURL, },);
}

const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  host: config.db.host || "localhost",
  port: config.db.port || 5432,
  username: config.db.user || "postgres",
  password: config.db.password || "postgres",
  database: config.db.name || "easy-onramp",
  poolSize: config.db.additional.poolSize || 300,
  extra: {
    idleTimeoutMillis: config.db.additional.idleTimeoutMillis || 12_000,
    statement_timeout: config.db.additional.statement_timeout || 20_000,
  },
  applicationName: "api",
  migrationsRun: false,
  synchronize: false,
  logging: false,
  entities: Object.values(Entities,),
  migrations: ["dist/libs/db/migrations/*.js",],
  subscribers: [],
};
export const typeOrmModuleOptions: TypeOrmModuleOptions = {
  ...(!replicaSet.length && { ...master, }),
  ...(replicaSet.length && {
    replication: {
      // Use first replica as master as for now API doesn't perform write queries.
      // If master or any replica is down the app won't start.
      // Traffic is randomly distributed across replica set for read queries.
      // There is no replica failure tolerance by typeOrm, it keeps sending traffic to a replica even if it is down.
      // Health check verifies master only, there is no way to get a connection for a specific replica from typeOrm.
      master,
      slaves: replicaSet,
    },
  }),
  ...dataSourceOptions,
  autoLoadEntities: true,
  retryDelay: 3000, // to cover 3 minute DB failover window
  retryAttempts: 70, // try to reconnect for 3.5 minutes,
};

const typeOrmCliDataSource = new DataSource(dataSourceOptions,);
export default typeOrmCliDataSource;
