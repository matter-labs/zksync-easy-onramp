import { config, } from "dotenv";
config();

const {
  UPDATE_PROVIDER_DATA_INTERVAL, KADO_API_KEY, TRANSAK_API_KEY, TRANSAK_STAGING_API_KEY, 
} = process.env;

export default {
  kadoApiKey: KADO_API_KEY,
  updateProviderDataInterval: parseInt(UPDATE_PROVIDER_DATA_INTERVAL, 10,) || 15 * 60 * 1000, // 15 min default
  transakApiKey: {
    production: TRANSAK_API_KEY,
    staging: TRANSAK_STAGING_API_KEY,
  },
};
