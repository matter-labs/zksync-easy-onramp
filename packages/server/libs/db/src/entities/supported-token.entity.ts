import {
  Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn, 
} from "typeorm";

import { RouteType,  } from "../enums";
import { BaseEntity, } from "./base.entity";
import { Provider, } from "./provider.entity";
import { Token, } from "./token.entity";

@Entity()
@Index([
  "providerKey",
  "tokenId",
  "type", 
], { unique: true, },)
export class SupportedToken extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Provider, (provider,) => provider.supportedTokens, { onDelete: "CASCADE", },)
  provider: Provider;

  @Column({ type: "varchar", length: 32, },)
  providerKey: string;

  @ManyToOne(() => Token, { onDelete: "CASCADE", },)
  token: Token;

  @Column()
  tokenId: number;

  @Column({
    type: "enum",
    enum: RouteType,
  },)
  type: RouteType;
}