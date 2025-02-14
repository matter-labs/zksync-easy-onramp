import { config, } from "dotenv";
config();

const { UPDATE_PROVIDER_DATA_INTERVAL, } = process.env;

export default { updateProviderDataInterval: parseInt(UPDATE_PROVIDER_DATA_INTERVAL, 10,) || 5 * 60 * 1000, };
