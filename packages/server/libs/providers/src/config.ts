import { config, } from "dotenv";
config();

const { UPDATE_PROVIDER_DATA_INTERVAL, TRANSAK_API_KEY, } = process.env;

export default {
  updateProviderDataInterval: parseInt(UPDATE_PROVIDER_DATA_INTERVAL, 10,) || 30 * 60 * 1000, /* 30 min default */
  transakApiKey: TRANSAK_API_KEY,
};
