import { config, } from "dotenv";
config();

const {
  COINGECKO_IS_PRO_PLAN,
  COINGECKO_API_KEY,
  UPDATE_TOKEN_OFFCHAIN_DATA_INTERVAL,
} = process.env;

export default {
  coingecko: {
    isProPlan: COINGECKO_IS_PRO_PLAN === "true",
    apiKey: COINGECKO_API_KEY,
  },
  updateTokenOffChainDataInterval: parseInt(UPDATE_TOKEN_OFFCHAIN_DATA_INTERVAL, 10,) || 30 * 60 * 1000,
};
