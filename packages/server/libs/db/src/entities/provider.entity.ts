import {
  Column, Entity, OneToMany, PrimaryColumn, 
} from "typeorm";

import { QuoteProviderType, } from "../enums";
import { BaseEntity, } from "./base.entity";
import { SupportedCountry, } from "./supported-country.entity";
import { SupportedKyc, } from "./supported-kyc.entity";
import { SupportedToken, } from "./supported-token.entity";

@Entity()
export class Provider extends BaseEntity {
  @PrimaryColumn({ length: 32, },)
  key: string;

  @Column()
  name: string;

  @Column()
  iconUrl: string;

  @Column({
    type: "enum",
    enum: QuoteProviderType,
  },)
  type: QuoteProviderType;

  @OneToMany(() => SupportedToken, (supportedToken,) => supportedToken.provider,)
  supportedTokens: SupportedToken[];

  @OneToMany(() => SupportedCountry, (supportedCountry,) => supportedCountry.provider,)
  supportedCountries: SupportedCountry[];

  @OneToMany(() => SupportedKyc, (supportedKyc,) => supportedKyc.provider,)
  supportedKyc: SupportedKyc[];
}