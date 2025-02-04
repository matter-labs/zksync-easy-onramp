import { Transform, } from "class-transformer";

export const ToNumber = (): PropertyDecorator => {
  return Transform(({ value, },) => {
    const val = Number(value,);
    return Number.isNaN(val,) ? undefined : val;
  },);
};
