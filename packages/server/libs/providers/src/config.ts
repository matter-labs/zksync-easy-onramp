import { config, } from "dotenv";
config();

const {
  UPDATE_PROVIDER_DATA_INTERVAL, TRANSAK_API_KEY, TRANSAK_STAGING_API_KEY, 
} = process.env;

export default {
  updateProviderDataInterval: parseInt(UPDATE_PROVIDER_DATA_INTERVAL, 10,) || 30 * 60 * 1000, /* 30 min default */
  transakApiKey: {
    production: TRANSAK_API_KEY,
    staging: TRANSAK_STAGING_API_KEY,
  },
};
