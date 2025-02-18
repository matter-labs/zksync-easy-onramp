import { Module, } from "@nestjs/common";
import { ConfigModule, } from "@nestjs/config";

import config from "./config";
import { SwapsService, } from "./swaps.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => config,], 
    },),
  ],
  providers: [SwapsService,],
  exports: [SwapsService,],
},)
export class SwapsModule {}
