import { Injectable, } from "@nestjs/common";

import { SupportedToken, } from "../entities";
import { UnitOfWork, } from "../unitOfWork";
import { BaseRepository, } from "./base.repository";

@Injectable()
export class SupportedTokenRepository extends BaseRepository<SupportedToken> {
  public constructor(unitOfWork: UnitOfWork,) {
    super(SupportedToken, unitOfWork,);
  }
}
