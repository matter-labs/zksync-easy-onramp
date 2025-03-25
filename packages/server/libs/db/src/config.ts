import { config, } from "dotenv";
config();

const {
  METRICS_PORT,
  COLLECT_DB_CONNECTION_POOL_METRICS_INTERVAL,
  DATABASE_USER,
  DATABASE_PASSWORD,
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_NAME,
  DATABASE_CONNECTION_POOL_SIZE,
  DATABASE_CONNECTION_IDLE_TIMEOUT_MS,
  DATABASE_STATEMENT_TIMEOUT_MS,
} = process.env;

const DATABASE_PORT_DEFAULT = 5432;

export default {
  db: {
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    host: DATABASE_HOST,
    port: parseInt(DATABASE_PORT,) || DATABASE_PORT_DEFAULT,
    name: DATABASE_NAME,
    url: `postgres://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT || DATABASE_PORT_DEFAULT}/${DATABASE_NAME}`,
    additional: {
      poolSize: parseInt(DATABASE_CONNECTION_POOL_SIZE,),
      idleTimeoutMillis: parseInt(DATABASE_CONNECTION_IDLE_TIMEOUT_MS,),
      statement_timeout: parseInt(DATABASE_STATEMENT_TIMEOUT_MS,),
    },
  },
  metrics: {
    port: parseInt(METRICS_PORT, 10,) || 3005,
    collectDbConnectionPoolMetricsInterval: parseInt(COLLECT_DB_CONNECTION_POOL_METRICS_INTERVAL, 10,) || 10000,
  },
};
