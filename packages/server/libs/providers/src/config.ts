import { config, } from "dotenv";
config();

const {
  UPDATE_PROVIDER_DATA_INTERVAL, KADO_API_KEY, TRANSAK_API_KEY, TRANSAK_SECRET_KEY, TRANSAK_STAGING_API_KEY, TRANSAK_STAGING_SECRET_KEY, 
} = process.env;

export default {
  kadoApiKey: KADO_API_KEY,
  updateProviderDataInterval: parseInt(UPDATE_PROVIDER_DATA_INTERVAL, 10,) || 15 * 60 * 1000, // 15 min default
  transak: {
    production: {
      apiKey: TRANSAK_API_KEY,
      secretKey: TRANSAK_SECRET_KEY,
    },
    staging: {
      apiKey: TRANSAK_STAGING_API_KEY,
      secretKey: TRANSAK_STAGING_SECRET_KEY,
    },
  },
};
