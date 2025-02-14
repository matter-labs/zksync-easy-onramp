import {
  Column, Entity, PrimaryGeneratedColumn, Unique, 
} from "typeorm";
import type { Address, } from "viem";

import { BaseEntity, } from "./base.entity";

@Entity()
@Unique([ "address", "chainId", ],)
export class Token extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "varchar",
    length: 42, 
  },)
  address: Address;

  @Column()
  chainId: number;

  @Column()
  decimals: number;

  @Column()
  symbol: string;

  @Column()
  name: string;

  @Column({ type: "double precision", },)
  usdPrice: number;
  
  @Column({ type: "double precision", },)
  marketCap: number;

  @Column({ nullable: true, },)
  iconUrl?: string;
}