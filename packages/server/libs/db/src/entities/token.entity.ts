import {
  Column, Entity, PrimaryGeneratedColumn, Unique, 
} from "typeorm";

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
  address: string;

  @Column()
  chainId: number;

  @Column()
  decimals: number;

  @Column()
  symbol: string;

  @Column()
  name: string;
}