import { Injectable, } from "@nestjs/common";

import { IProvider, } from "./provider.interface";
import { KadoProvider, } from "./providers/kado";

@Injectable()
export class ProvidersRegistry {
  providers: IProvider[];

  constructor(kadoProvider: KadoProvider,) {
    this.providers = [kadoProvider,];
  }
}