import { Transform, } from "class-transformer";

export function ToBoolean() {
  return Transform(({ value, },) => {
    if (typeof value === "string") {
      value = value.toLowerCase();
      return value === "true" || value === "1" ? true : false;
    }
    return Boolean(value,);
  },);
}
