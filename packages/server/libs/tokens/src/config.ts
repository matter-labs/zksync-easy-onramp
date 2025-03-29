import { config, } from "dotenv";
config();

const {
  COINGECKO_IS_PRO_PLAN,
  COINGECKO_API_KEY,
  TOKEN_OFFCHAIN_DATA_UPDATE_INTERVAL,
} = process.env;

export default {
  coingecko: {
    isProPlan: COINGECKO_IS_PRO_PLAN === "true",
    apiKey: COINGECKO_API_KEY,
  },
  tokenOffChainDataUpdateInterval: parseInt(TOKEN_OFFCHAIN_DATA_UPDATE_INTERVAL, 10,) || 30 * 60 * 1000, // 30 min default
};
