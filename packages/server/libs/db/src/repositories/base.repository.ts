import { Injectable, } from "@nestjs/common";
import type {
  DeleteResult,EntityTarget, FindManyOptions, FindOneOptions, FindOptionsWhere, InsertResult, 
} from "typeorm";
import { QueryDeepPartialEntity, } from "typeorm/query-builder/QueryPartialEntity";

import { UnitOfWork, } from "../unitOfWork";

const BATCH_SIZE = 1000;

@Injectable()
export abstract class BaseRepository<T,> {
  public constructor(protected readonly entityTarget: EntityTarget<T>, protected readonly unitOfWork: UnitOfWork,) {}

  public createQueryBuilder = (alias: string,) => {
    const transactionManager = this.unitOfWork.getTransactionManager();
    return transactionManager.createQueryBuilder(this.entityTarget, alias,);
  };

  public getTransactionManager = () => {
    return this.unitOfWork.getTransactionManager();
  };

  public async addMany(records: Partial<T>[],): Promise<void> {
    if (!records?.length) {
      return;
    }

    const transactionManager = this.unitOfWork.getTransactionManager();

    let recordsToAdd = [];
    for (let i = 0; i < records.length; i++) {
      recordsToAdd.push(records[i],);
      if (recordsToAdd.length === BATCH_SIZE || i === records.length - 1) {
        await transactionManager.insert<T>(this.entityTarget, recordsToAdd,);
        recordsToAdd = [];
      }
    }
  }

  public add(record: QueryDeepPartialEntity<T>,): Promise<InsertResult> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    return transactionManager.insert<T>(this.entityTarget, record,);
  }

  public async update(id: number, partialEntity: QueryDeepPartialEntity<T>,): Promise<void> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    await transactionManager.update<T>(this.entityTarget, { id, }, partialEntity,);
  }

  // Do not use upsert for tables with auto-incremented fields, each update also increases sequence for the next insert
  public async upsert(
    record: QueryDeepPartialEntity<T>,
    shouldExcludeNullValues = true,
    conflictPaths = ["id",],
  ): Promise<void> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    const recordToUpsert = shouldExcludeNullValues
      ? Object.keys(record,).reduce((acc, key,) => {
        if (record[key] !== null && record[key] !== undefined) {
          acc[key] = record[key];
        }
        return acc;
      }, {},)
      : record;
    await transactionManager.upsert<T>(this.entityTarget, recordToUpsert, {
      conflictPaths,
      skipUpdateIfNoValuesChanged: true,
    },);
  }

  public delete(where: FindOptionsWhere<T>,): Promise<DeleteResult> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    return transactionManager.delete<T>(this.entityTarget, where,);
  }

  public async findOneBy(where: FindOptionsWhere<T> | FindOptionsWhere<T>[],): Promise<T | null> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    return await transactionManager.findOneBy(this.entityTarget, where,);
  }

  public async findOne(options: FindOneOptions<T>,): Promise<T | null> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    return await transactionManager.findOne(this.entityTarget, options,);
  }

  public async find(options: FindManyOptions<T>,): Promise<T[]> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    return await transactionManager.find(this.entityTarget, options,);
  }

  public async count(options: FindManyOptions<T>,): Promise<number> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    return await transactionManager.count(this.entityTarget, options,);
  }
}
