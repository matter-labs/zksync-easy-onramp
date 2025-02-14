export class TimedCache<T,> {
  private cacheDuration: number;
  private lastExecutionTime: number | null = null;
  private lastResult: Promise<T> | null = null;
  private readonly fn: () => Promise<T>;

  constructor(fn: () => Promise<T>, cacheDuration: number,) {
    this.fn = fn;
    this.cacheDuration = cacheDuration;
  }

  async execute(): Promise<T> {
    const now = Date.now();

    if (this.lastResult && this.lastExecutionTime !== null && now - this.lastExecutionTime < this.cacheDuration) {
      return this.lastResult.catch(() => this.runFunction(),); // Prevent returning failed promise
    }

    return this.runFunction();
  }

  private async runFunction(): Promise<T> {
    this.lastExecutionTime = Date.now();
    const result = this.fn()
      .then((data,) => {
        this.lastResult = Promise.resolve(data,); // Only cache if it succeeds
        return data;
      },)
      .catch((error,) => {
        this.clearCache(); // Clear cache on error
        throw error;
      },);

    this.lastResult = result; // Temporarily store in case of multiple calls
    return result;
  }

  clearCache(): void {
    this.lastResult = null;
    this.lastExecutionTime = null;
  }
}