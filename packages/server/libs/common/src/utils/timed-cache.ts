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

    if (
      this.lastResult &&
      this.lastExecutionTime !== null &&
      now - this.lastExecutionTime < this.cacheDuration
    ) {
      return this.lastResult.catch(() => this.runFunction(),);
    }

    return this.runFunction();
  }

  private async runFunction(): Promise<T> {
    this.lastExecutionTime = Date.now();

    const result = this.fn()
      .then((data,) => {
        this.lastResult = Promise.resolve(data,);
        return data;
      },)
      .catch((error,) => {
        this.clearCache();
        throw error;
      },);

    this.lastResult = result;
    return result;
  }

  updateTtl(newDuration: number,): void {
    this.cacheDuration = newDuration;
    this.lastExecutionTime = Date.now();
  }

  clearCache(): void {
    this.lastResult = null;
    this.lastExecutionTime = null;
  }
}