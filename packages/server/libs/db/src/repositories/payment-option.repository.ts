import { Injectable } from "@nestjs/common";
import { PaymentOption } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";

@Injectable()
export class PaymentOptionRepository extends BaseRepository<PaymentOption> {
  public constructor(unitOfWork: UnitOfWork) {
    super(PaymentOption, unitOfWork);
  }
}
