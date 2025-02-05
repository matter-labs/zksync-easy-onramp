import { Transform, } from "class-transformer";

export const ToStringsArray = () => {
  return Transform(({ value, },) => {
    if (Array.isArray(value,)) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed.length) return undefined;
      return trimmed.split(",",);
    }

    return undefined;
  },);
};
