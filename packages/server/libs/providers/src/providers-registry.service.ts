import { Injectable, } from "@nestjs/common";

import { IProvider, } from "./provider.interface";
import { TransakProvider, } from "./providers/transak";

@Injectable()
export class ProvidersRegistry {
  providers: IProvider[];

  constructor(transakProvider: TransakProvider,) {
    this.providers = [transakProvider,];
  }

  public get providerKeys(): string[] {
    return this.providers.map((e,) => e.meta.key,);
  }
}
