import {
  Column, Entity, ManyToOne,
  PrimaryGeneratedColumn, 
} from "typeorm";

import { KycRequirement, } from "../enums";
import { BaseEntity, } from "./base.entity";
import { Provider, } from "./provider.entity";

@Entity()
export class SupportedKyc extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Provider, (provider,) => provider.supportedTokens, { onDelete: "CASCADE", },)
  provider: Provider;

  @Column({ type: "varchar", length: 32, },)
  providerKey: string;

  @Column({
    type: "enum",
    enum: KycRequirement,
  },)
  kycLevel: KycRequirement;
}