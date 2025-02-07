import { config, } from "dotenv";
config();

const {
  BINANCE_API_ECDSA_PRIVATE_KEY,
  BINANCE_API_SOURCE_KEY,
} = process.env;

export default {
  binance: {
    apiEcdsaPrivateKey: BINANCE_API_ECDSA_PRIVATE_KEY,
    apiSourceKey: BINANCE_API_SOURCE_KEY,
  },
};
