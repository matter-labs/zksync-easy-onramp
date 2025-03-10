import { Injectable, } from "@nestjs/common";

import { SupportedKyc, } from "../entities";
import { UnitOfWork, } from "../unitOfWork";
import { BaseRepository, } from "./base.repository";

@Injectable()
export class SupportedKycRepository extends BaseRepository<SupportedKyc> {
  public constructor(unitOfWork: UnitOfWork,) {
    super(SupportedKyc, unitOfWork,);
  }
}
