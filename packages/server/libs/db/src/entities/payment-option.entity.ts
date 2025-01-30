import {
  Column, Entity, Index,ManyToOne, PrimaryGeneratedColumn, 
} from "typeorm";

import { PaymentType, } from "../enums";
import { BaseEntity, } from "./base.entity";
import { Provider, } from "./provider.entity";

@Entity()
@Index(["providerId", "countryCode",],)
export class PaymentOption extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Provider, (provider,) => provider.paymentOptions,)
  provider: Provider;

  @Column()
  providerId: number;

  @Column({
    type: "enum",
    enum: PaymentType, 
  },)
  paymentType: PaymentType;

  @Column({
    type: "varchar",
    length: 2,
    nullable: true, 
  },)
  countryCode?: string;
}