# server

## 2.1.0

### Minor Changes

- e66eef3: Allow configuration of services to receive quotes for.

  Previously the services configuration was available in the SDK configuration,
  but it did not do anything. This is now available and allows the user to
  configure the services they want to receive quotes for. The default is
  to receive quotes for all services, but the user can now configure this
  to only receive quotes for specific services.

## 2.0.0

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

## 1.2.0

### Minor Changes

- 5df53a8: Added Transak onramp provider support

## 1.1.0

### Minor Changes

- e63d08b: - Removed `mainnet` chain (it was temporary)
  - Added some logs for better debugging
  - Added more data to the config endpoint

## 1.0.1

### Patch Changes

- f2ef21a: Update package dependencies for sdk and server.
  @lifi/sdk updated to 3.6.2 for the sdk and server, and @reown/appkit to 1.7.0 for the demo.

## 1.0.0

### Major Changes

- 4b03c0b: Adds the config api endpoint to the SDK which provides data on chains, providers and tokens.

  A new function `fetchConfig()` is added to the SDK to return config data from the server.
