import { Injectable } from "@nestjs/common";
import { Token } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";

@Injectable()
export class TokenRepository extends BaseRepository<Token> {
  public constructor(unitOfWork: UnitOfWork) {
    super(Token, unitOfWork);
  }
}
