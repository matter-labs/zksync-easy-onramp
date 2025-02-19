import { config, } from "dotenv";
config();

const { LIFI_API_KEY, } = process.env;

export default { lifiApiKey: LIFI_API_KEY, };
