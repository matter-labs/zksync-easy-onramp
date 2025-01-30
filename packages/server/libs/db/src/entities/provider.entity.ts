import { Column, Entity, OneToMany,PrimaryGeneratedColumn, } from "typeorm";

import { QuoteProviderType, } from "../enums";
import { BaseEntity, } from "./base.entity";
import { PaymentOption, } from "./payment-option.entity";
import { SupportedToken, } from "./supported-token.entity";

@Entity()
export class Provider extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, },)
  key: string;

  @Column()
  name: string;

  @Column({ nullable: true, },)
  iconUrl?: string;

  @Column({
    type: "enum",
    enum: QuoteProviderType, 
  },)
  type: QuoteProviderType;

  @OneToMany(() => PaymentOption, (paymentOption,) => paymentOption.provider,)
  paymentOptions: PaymentOption[];

  @OneToMany(() => SupportedToken, (supportedToken,) => supportedToken.provider,)
  supportedTokens: SupportedToken[];
}