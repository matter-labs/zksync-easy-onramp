import {
  Column, Entity, ManyToOne,
  PrimaryGeneratedColumn, 
} from "typeorm";

import { BaseEntity, } from "./base.entity";
import { Provider, } from "./provider.entity";

@Entity()
export class SupportedCountry extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Provider, (provider,) => provider.supportedTokens, { onDelete: "CASCADE", },)
  provider: Provider;

  @Column({ type: "varchar", length: 32, },)
  providerKey: string;

  @Column({ type: "varchar", length: 2, },)
  countryCode: string;
}