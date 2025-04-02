import { ToBoolean, } from "@app/common/decorators/to-boolean";
import { IsOptional, IsString, } from "class-validator";

export class OrderStatusTransakDto {
  @IsString()
  orderId: string;

  @IsOptional()
  @ToBoolean()
  dev?: boolean;
}