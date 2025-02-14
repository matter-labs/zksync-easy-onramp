import { SyncManager, } from "@app/common/services/sync-manager.service";
import { AbstractSyncWorker, } from "@app/common/utils/sync-worker";
import { Injectable, Logger, } from "@nestjs/common";
import { ConfigService, } from "@nestjs/config";

import { IProvider, } from "./provider.interface";
import { ProvidersRegistry, } from "./providers-registry.service";

const SYNC_KEY_BASE = "providers_data_sync";
const getSyncKey = (providerKey: string,) => `${SYNC_KEY_BASE}_${providerKey}`;
const RETRY_DELAY = 30_000;

@Injectable()
export class ProvidersUpdateService extends AbstractSyncWorker {
  private readonly updateProviderDataInterval: number;
  protected readonly logger: Logger;

  constructor(
    private readonly providersRegistry: ProvidersRegistry,
    protected readonly syncManager: SyncManager,
    configService: ConfigService,
  ) {
    const logger = new Logger(ProvidersUpdateService.name,);
    const updateProviderDataInterval = configService.get<number>("updateProviderDataInterval",);
    super(
      {
        resyncDelay: updateProviderDataInterval,
        onFailRetryTimeout: RETRY_DELAY,
        syncKey: SYNC_KEY_BASE,
      },
      syncManager,
      logger,
    );
    this.updateProviderDataInterval = updateProviderDataInterval;
    this.logger = logger;
  }

  protected async sync(): Promise<void> {
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
    if (hadErrors) throw new Error("Failed to update data for some providers",);
  }

  async syncProvider(provider: IProvider,) {
    const syncKey = getSyncKey(provider.meta.key,);
    const shouldUpdate = await this.syncManager.shouldSync(
      syncKey,
      this.updateProviderDataInterval,
    );
    if (shouldUpdate) {
      this.logger.log(`Updating provider ${provider.meta.name} data...`,);
      await provider.syncRoutes();
      this.logger.debug(`Provider ${provider.meta.name} data updated successfully.`,);
      await this.syncManager.markSynced(syncKey,);
    } else {
      this.logger.log(`Skipping provider ${provider.meta.name} data update, already up-to-date.`,);
    }
  };
}