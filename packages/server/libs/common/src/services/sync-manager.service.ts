// packages/server/libs/services/src/sync-manager.ts

import { SyncMetadataRepository, } from "@app/db/repositories";
import { Injectable, } from "@nestjs/common";

@Injectable()
export class SyncManager {
  constructor(private readonly syncMetadataRepository: SyncMetadataRepository,) {}

  private async getLastSyncTime(key: string,): Promise<Date | null> {
    const record = await this.syncMetadataRepository.findOne({ where: { key, }, },);
    return record ? record.updatedAt : null;
  }

  private async updateSyncTime(key: string, time?: Date,): Promise<void> {
    await this.syncMetadataRepository.upsert({ key, updatedAt: time || new Date(), },);
  }

  async shouldSync(key: string, maxAgeMs: number,): Promise<boolean> {
    const lastSync = await this.getLastSyncTime(key,);
    if (!lastSync) return true;
    return Date.now() - lastSync.getTime() > maxAgeMs;
  }

  async markSynced(key: string, time?: Date,): Promise<void> {
    await this.updateSyncTime(key, time,);
  }
}