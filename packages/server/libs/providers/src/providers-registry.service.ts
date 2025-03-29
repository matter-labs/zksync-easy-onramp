import { Injectable, } from "@nestjs/common";

import { IProvider, } from "./provider.interface";
import { KadoProvider, } from "./providers/kado";
import { TransakProvider, } from "./providers/transak";

@Injectable()
export class ProvidersRegistry {
  providers: IProvider[];

  constructor(kadoProvider: KadoProvider, transakProvider: TransakProvider,) {
    this.providers = [ kadoProvider, transakProvider, ];
  }
}