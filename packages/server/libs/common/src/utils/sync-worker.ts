import type { SyncManager, } from "@app/common/services/sync-manager.service";
import type { Logger, } from "@nestjs/common";

interface SyncWorkerOptions {
  resyncDelay: number;
  onFailRetryTimeout: number;
  syncKey?: string; // Unique key for SyncManager
}

export abstract class AbstractSyncWorker {
  private readonly resyncDelay: number;
  private readonly onFailRetryTimeout: number;
  private readonly syncKey: string | undefined;

  private isRunning = false;
  private firstSyncPromise: Promise<void> | null = null;
  private lastPromise: Promise<void> | null = null;

  constructor(
    options: SyncWorkerOptions,
    protected readonly syncManager: SyncManager,
    protected readonly logger: Logger,
  ) {
    this.resyncDelay = options.resyncDelay;
    this.onFailRetryTimeout = options.onFailRetryTimeout;
    this.syncKey = options.syncKey;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.logger.log(`[${this.syncKey}] SyncWorker started.`,);

    const runLoop = async () => {
      while (this.isRunning) {
        this.lastPromise = this.runJob();
        if (!this.firstSyncPromise) {
          this.firstSyncPromise = this.lastPromise;
        }
        await this.lastPromise;
        this.logger.log(`[${this.syncKey}] Next sync in ${this.resyncDelay / 1000} seconds.`,);
        await this.delay(this.resyncDelay,);
      }
    };
    runLoop();
  }

  stop(): void {
    this.isRunning = false;
    this.logger.log(`[${this.syncKey}] SyncWorker stopped.`,);
  }

  async waitForFirstSync(): Promise<void> {
    if (!this.firstSyncPromise) {
      this.start();
    }
    return this.firstSyncPromise!;
  }

  protected abstract sync(): Promise<void>;

  get syncManagerEnabled(): boolean {
    return this.syncKey !== undefined;
  }

  private async runJob(): Promise<void> {
    try {
      if (this.syncManagerEnabled) {
        const shouldSync = await this.syncManager.shouldSync(this.syncKey!, this.resyncDelay,);
        if (!shouldSync) {
          this.logger.log(`[${this.syncKey}] Skipping sync, data is up-to-date.`,);
          return;
        }
      }

      this.logger.log(`[${this.syncKey}] Performing sync...`,);
      await this.sync();

      if (this.syncManagerEnabled) {
        await this.syncManager.markSynced(this.syncKey!,);
      }
    } catch (err) {
      this.logger.error(err,);
      this.logger.error(`[${this.syncKey}] Sync failed. Retrying in ${this.onFailRetryTimeout / 1000} seconds.`,);
      await this.delay(this.onFailRetryTimeout,);
      await this.runJob(); // Retry
    }
  }

  private async delay(ms: number,): Promise<void> {
    return new Promise((resolve,) => setTimeout(resolve, ms,),);
  }
}