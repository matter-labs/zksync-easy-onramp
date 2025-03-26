import { config, } from "dotenv";
config();

const { KADO_API_KEY, UPDATE_PROVIDER_DATA_INTERVAL, } = process.env;

export default {
  kadoApiKey: KADO_API_KEY,
  updateProviderDataInterval: parseInt(UPDATE_PROVIDER_DATA_INTERVAL, 10,) || 15 * 60 * 1000, // 30 min default
};
