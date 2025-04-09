# zksync-easy-onramp

## 3.0.0

### Major Changes

- 08af3c5: Previously quotes were returned as individual quotes
  by payment method with the provider information included.
  Now they are grouped by provider and available
  under the paymentMethods array.
  This change will affect how you interact
  with the quotes in your application.
  Please review the updated documentation for more details
  on how to work with the new quote structure.

### Patch Changes

- 2113d3b: Update `@lifi/sdk` from 3.6.2 to 3.6.7.
  Fix bug in executors in SDK that allowed steps to continue further than they should have.
  Updated server transak quotes to return full data for tokens.

## 2.4.0

### Minor Changes

- 5df53a8: Added Transak onramp provider support

## 2.3.0

### Minor Changes

- e63d08b: - Removed `mainnet` chain (it was temporary)
  - Added some logs for better debugging
  - Added more data to the config endpoint

## 2.2.1

### Patch Changes

- 6d8e852: Add publish flag to release workflow to remove console logs from production build of the sdk.
- f2ef21a: Update package dependencies for sdk and server.
  @lifi/sdk updated to 3.6.2 for the sdk and server, and @reown/appkit to 1.7.0 for the demo.
- 9d71429: Update the API endpoint in the sdk config.

## 2.2.0

### Minor Changes

- 93d92aa: Set viem as peer dependency and remove from bundled package.

## 2.1.0

### Minor Changes

- 55e67c1: Update readme documentation for the SDK.

## 2.0.0

### Major Changes

- 4b03c0b: Adds the config api endpoint to the SDK which provides data on chains, providers and tokens.

  A new function `fetchConfig()` is added to the SDK to return config data from the server.
