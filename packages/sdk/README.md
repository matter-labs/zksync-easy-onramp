# ZKsync Easy On-Ramp SDK

ZKsync Easy On-Ramp SDK simplifies fiat on-ramping for your application.
This NPM package provides a seamless way to integrate fiat purchases and token swaps, ensuring a
smooth user experience.
It connects to a growing list of fiat on-ramp providers and leverages LI.FI for token swaps when
needed.
The SDK manages order tracking, transaction signing, and execution,
delivering a complete end-to-end on-ramping solution.

## Installation

```sh
npm install --save zksync-easy-onramp
```

## Quick start

### Configure the SDK

```ts
import { createOnRampConfig } from "zksync-easy-onramp";

createOnRampConfig({
  integrator: "ZKsync Easy OnRamp Demo",
  dev: true, // add dev flag to test with sandboxes
});
```

### Request quotes

```ts
import { fetchQuotes } from "zksync-easy-onramp";

// fetching quotes for $25 USD for Ether on ZKsync
const quotes = await fetchQuotes({
  toAddress: "0xE6a8bEEFC1Bca3046235e0d1f8db805734949024",
  fiatAmount: 25,
  fiatCurrency: "USD",
  chainId: 324,
  toToken: "0x000000000000000000000000000000000000800A",
});
```

### Execute a quote

```ts
import { executeRoute } from "zksync-easy-onramp";

const quotes = await fetchQuotes({...});
const selectedQuote = quotes[0];
// A quote needs to be converted to a route before executing.
const routeToExecute = quoteToRoute("buy", selectedQuote.paymentMethods[0], selectedQuote.provider);
const executedRoute = executeRoute(routeToExecute, {
  onUpdateHook: (executingRoute) => {
    // receive the latest state change
    // of the quote that is executing
    console.log(executingRoute);
  }
});
```

### Further documentation

To read more about implementing and using the ZKsync Easy On-Ramp SDK, check out the [section on
ZKsync Docs](https://docs.zksync.io/zksync-era/tooling/zksync-easy-onramp).

## Example

Check out the [demo app](https://github.com/matter-labs/zksync-easy-onramp/blob/main/apps/demo) to
see a working implementation of the SDK in a Vue app.

## License

This project is licensed under both the [Apache-2.0](https://github.com/matter-labs/zksync-easy-onramp/blob/LICENSE-APACHE) and [MIT](https://github.com/matter-labs/zksync-easy-onramp/blob/LICENSE-MIT) licenses.
