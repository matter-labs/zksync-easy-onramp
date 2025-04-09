---
"server": major
"zksync-easy-onramp": major
---

Previously quotes were returned as individual quotes
by payment method with the provider information included.
Now they are grouped by provider and available
under the paymentMethods array.
This change will affect how you interact
with the quotes in your application.
Please review the updated documentation for more details
on how to work with the new quote structure.
