import type { ProcessStatus, ProcessType, } from "@sdk/types/sdk";

export const processMessages: Record<
  ProcessType,
  Partial<Record<ProcessStatus, string>>
> = {
  EXTERNAL: {
    PENDING: "Waiting for user action",
    DONE: "External action completed",
    FAILED: "External action failed",
    CANCELLED: "External action cancelled",
  },
  STATUS_CHECK: {
    PENDING: "Checking status",
    DONE: "Status check completed",
    FAILED: "Status check failed",
    CANCELLED: "Status check cancelled",
  },
};
