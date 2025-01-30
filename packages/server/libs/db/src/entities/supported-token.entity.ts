import {
  Column, Entity, Index,ManyToOne, PrimaryGeneratedColumn, 
} from "typeorm";

import { BaseEntity, } from "./base.entity";
import { Provider, } from "./provider.entity";
import { Token, } from "./token.entity";

@Entity()
@Index(["providerId", "tokenId", "countryCode",],)
export class SupportedToken extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Provider, (provider,) => provider.supportedTokens,)
  provider: Provider;

  @Column()
  providerId: number;

  @ManyToOne(() => Token,)
  token: Token;

  @Column()
  tokenId: number;

  @Column({
    type: "varchar",
    length: 2,
    nullable: true, 
  },)
  countryCode?: string;

  @Column({
    type: "numeric",
    nullable: true, 
  },)
  feePercent?: number;

  @Column({
    type: "bigint",
    nullable: true, 
  },)
  minAmount?: bigint;

  @Column({
    type: "bigint",
    nullable: true, 
  },)
  maxAmount?: bigint;
}