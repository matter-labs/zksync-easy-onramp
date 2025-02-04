import { Injectable, } from "@nestjs/common";

import { ProvidersRegistry, } from "./providers-registry.service";

@Injectable()
export class ProvidersUpdateService {
  constructor(
    private readonly providersRegistry: ProvidersRegistry,
  ) {}

  async syncProviderRoutes() {
    // TODO: add check for last sync date of each provider
    await Promise.all(
      this.providersRegistry.providers.map((provider,) => provider.syncRoutes(),),
    );
  };
}