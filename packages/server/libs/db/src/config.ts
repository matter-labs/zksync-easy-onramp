import { config, } from "dotenv";
config();

const {
  METRICS_PORT,
  COLLECT_DB_CONNECTION_POOL_METRICS_INTERVAL,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_CONNECTION_POOL_SIZE,
  DB_CONNECTION_IDLE_TIMEOUT_MS,
  DB_STATEMENT_TIMEOUT_MS,
} = process.env;

export default {
  db: {
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: parseInt(DB_PORT,),
    name: DB_NAME,
    url: `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
    additional: {
      poolSize: parseInt(DB_CONNECTION_POOL_SIZE,),
      idleTimeoutMillis: parseInt(DB_CONNECTION_IDLE_TIMEOUT_MS,),
      statement_timeout: parseInt(DB_STATEMENT_TIMEOUT_MS,),
    },
  },
  metrics: {
    port: parseInt(METRICS_PORT, 10,) || 3005,
    collectDbConnectionPoolMetricsInterval: parseInt(COLLECT_DB_CONNECTION_POOL_METRICS_INTERVAL, 10,) || 10000,
  },
};
