---
"zksync-easy-onramp": minor
"server": minor
---

Allow configuration of services to receive quotes for.

Previously the services configuration was available in the SDK configuration,
but it did not do anything. This is now available and allows the user to
configure the services they want to receive quotes for. The default is
to receive quotes for all services, but the user can now configure this
to only receive quotes for specific services.
