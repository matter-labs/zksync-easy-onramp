import { Injectable } from "@nestjs/common";
import { Provider } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";

@Injectable()
export class ProviderRepository extends BaseRepository<Provider> {
  public constructor(unitOfWork: UnitOfWork) {
    super(Provider, unitOfWork);
  }
}
