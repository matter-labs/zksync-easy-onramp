import {
  Column, Entity, Index,ManyToOne, PrimaryGeneratedColumn, 
} from "typeorm";

import { PaymentMethod, } from "../enums";
import { BaseEntity, } from "./base.entity";
import { Provider, } from "./provider.entity";

@Entity()
@Index([ "providerKey", "countryCode", ],)
export class PaymentOption extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Provider, (provider,) => provider.paymentOptions, { onDelete: "CASCADE", },)
  provider: Provider;

  @Column({ type: "varchar", length: 32, },)
  providerKey: string;

  @Column({
    type: "enum",
    enum: PaymentMethod, 
  },)
  paymentType: PaymentMethod;

  @Column({
    type: "varchar",
    length: 2,
    nullable: true, 
  },)
  countryCode?: string;
}