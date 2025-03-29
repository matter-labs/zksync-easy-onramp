# zksync-easy-onramp

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
