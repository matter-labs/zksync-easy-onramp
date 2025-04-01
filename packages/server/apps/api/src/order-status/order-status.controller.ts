import { OrderStatusResponse, TransakProvider, } from "@app/providers/providers/transak";
import {
  Controller, Get,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBody, ApiResponse, ApiTags, 
} from "@nestjs/swagger";

import { OrderStatusTransakDto, } from "./order-status.dto";

@ApiTags("order-status",)
@Controller("order-status",)
export class OrderStatusController {
  constructor(
    private readonly transakProviderService: TransakProvider,
  ) {}

  @Get("transak",)
  @ApiBody({ type: OrderStatusTransakDto, },)
  @ApiResponse({ type: OrderStatusResponse, },)
  @UsePipes(new ValidationPipe({ transform: true, },),)
  async getOrderStatus(@Query() _options: OrderStatusTransakDto,) {
    return await this.transakProviderService.getOrderStatus(_options.orderId, { dev: _options.dev, },);
  }
}
