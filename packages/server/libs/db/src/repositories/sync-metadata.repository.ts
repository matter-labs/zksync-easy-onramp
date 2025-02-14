import { Injectable, } from "@nestjs/common";

import { SyncMetadata, } from "../entities";
import { UnitOfWork, } from "../unitOfWork";
import { BaseRepository, } from "./base.repository";

@Injectable()
export class SyncMetadataRepository extends BaseRepository<SyncMetadata> {
  public constructor(unitOfWork: UnitOfWork,) {
    super(SyncMetadata, unitOfWork,);
  }
}
