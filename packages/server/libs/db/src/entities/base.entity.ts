import { CreateDateColumn, UpdateDateColumn, } from "typeorm";

export abstract class BaseEntity {
  @CreateDateColumn({ type: "timestamptz", },)
  public readonly createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", },)
  public readonly updatedAt: Date;
}
