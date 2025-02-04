import { Transform, } from "class-transformer";

export const ToNumber = (): PropertyDecorator => {
  return Transform(({ value, },) => {
    console.log(123123, value,);
    const val = Number(value,);
    return Number.isNaN(val,) ? undefined : val;
  },);
};
