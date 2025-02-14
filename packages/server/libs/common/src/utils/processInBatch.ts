/**
 * Splits an array into smaller batches and processes each batch using a provided handler function.
 */
export async function processInBatches<T,>(
  items: T[],
  batchSize: number,
  handler: (batch: T[]) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    await handler(items.slice(i, i + batchSize,),);
  }
}