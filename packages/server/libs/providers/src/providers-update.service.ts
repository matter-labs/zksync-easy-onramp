import { SyncManager, } from "@app/common/services/sync-manager.service";
import { waitFor, } from "@app/common/utils/waitFor";
import { Worker, } from "@app/common/utils/worker";
import { Injectable, Logger, } from "@nestjs/common";
import { ConfigService, } from "@nestjs/config";

import { IProvider, } from "./provider.interface";
import { ProvidersRegistry, } from "./providers-registry.service";

const SYNC_KEY_BASE = "providers_data_sync";
const getSyncKey = (providerKey: string,) => `${SYNC_KEY_BASE}_${providerKey}`;
const RETRY_DELAY = 30_000;

@Injectable()
export class ProvidersUpdateService extends Worker {
  private readonly updateProviderDataInterval: number;
  private readonly logger: Logger;
    
  constructor(
    private readonly providersRegistry: ProvidersRegistry,
    private readonly syncManager: SyncManager,
    configService: ConfigService,
  ) {
    super();
    this.updateProviderDataInterval = configService.get<number>("updateProviderDataInterval",);
    this.logger = new Logger(ProvidersUpdateService.name,);
  }

  protected async runProcess(): Promise<void> {
    let nextRunDelay = this.updateProviderDataInterval;
    let hadErrors = false;

    await Promise.allSettled(
      this.providersRegistry.providers.map(
        (provider,) => this.syncProvider(provider,)
          .catch((err,) => {
            this.logger.error(`Failed to update provider ${provider.meta.name} data. Error: ${err}`,);
            hadErrors = true;
          },),
      ),
    );

    if (hadErrors) {
      this.logger.error(`Failed to update data for some providers. Retrying in ${RETRY_DELAY / 1000} seconds.`,);
      nextRunDelay = RETRY_DELAY;
    }
  
    // Wait for next execution
    this.logger.log(`Next providers data update in ${nextRunDelay / 1000} seconds.`,);
    await waitFor(() => !this.currentProcessPromise, nextRunDelay,);
    if (!this.currentProcessPromise) return;
  
    return this.runProcess();
  }

  async syncProvider(provider: IProvider,) {
    const shouldUpdate = await this.syncManager.shouldSync(
      getSyncKey(provider.meta.key,),
      this.updateProviderDataInterval,
    );
    if (shouldUpdate) {
      this.logger.log(`Updating provider ${provider.meta.name} data...`,);
      await provider.syncRoutes();
      this.logger.debug(`Provider ${provider.meta.name} data updated successfully.`,);
    } else {
      this.logger.log(`Skipping provider ${provider.meta.name} data update, already up-to-date.`,);
    }
  };
}