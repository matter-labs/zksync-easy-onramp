import { createConfig, } from "@lifi/sdk";

import type { SDKConfig, } from "./types/sdk";

export type ConfigOptions = Partial<SDKConfig> & { integrator: SDKConfig["integrator"] };

export function createOnRampConfig(configOptions: ConfigOptions,): SDKConfig {
  if (!configOptions.integrator) {
    throw new Error("Integrator name is required",);
  }
  const _config = config.set(configOptions,);

  return _config;
}

export const config = (() => {
  const _config: SDKConfig = {
    integrator: "zksync easy-onramp",
    apiUrl: "https://easy-onramp-api.zksync.dev/api",
    services: [],
    provider: null,
    dev: false,
  };

  return {
    get() {
      return _config;
    },
    set(configOptions: Partial<SDKConfig>,) {
      const { ...otherOptions } = configOptions;
      Object.assign(_config, otherOptions,);
      if (configOptions.provider) {
        createConfig({
          integrator: "ZKsync Easy OnRamp",
          providers: [configOptions.provider,],
        },);
      }
      return _config;
    },
  };
})();
