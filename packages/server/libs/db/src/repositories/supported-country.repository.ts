import { Injectable, } from "@nestjs/common";

import { SupportedCountry, } from "../entities";
import { UnitOfWork, } from "../unitOfWork";
import { BaseRepository, } from "./base.repository";

@Injectable()
export class SupportedCountryRepository extends BaseRepository<SupportedCountry> {
  public constructor(unitOfWork: UnitOfWork,) {
    super(SupportedCountry, unitOfWork,);
  }
}
