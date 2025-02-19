import type { SDKConfig, } from "./types/sdk";

export type ConfigOptions = Partial<SDKConfig> & { integrator: SDKConfig["integrator"] };

export function createConfig(configOptions: ConfigOptions,): SDKConfig {
  if (!configOptions.integrator) {
    throw new Error("Integrator name is required",);
  }
  const _config = config.set(configOptions,);

  return _config;
}

export const config = (() => {
  const _config: SDKConfig = {
    integrator: "zksync easy-onramp",
    services: [],
    dev: false,
  };

  return {
    get() {
      return _config;
    },
    set(configOptions: Partial<SDKConfig>,) {
      const { ...otherOptions } = configOptions;
      Object.assign(_config, otherOptions,);
      return _config;
    },
  };
})();
