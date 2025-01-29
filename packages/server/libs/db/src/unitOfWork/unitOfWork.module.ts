import { Module } from "@nestjs/common";
import { UnitOfWork } from "./unitOfWork.provider";
import { metricProviders } from "../metrics";

@Module({
  providers: [...metricProviders, UnitOfWork],
  exports: [UnitOfWork],
})
export class UnitOfWorkModule {}
