
import {
  Column, Entity, PrimaryColumn, 
} from "typeorm";

@Entity()
export class SyncMetadata {
  @PrimaryColumn({ length: 32, },)
  key: string;

  @Column({ type: "timestamptz", },)
  updatedAt: Date;
}