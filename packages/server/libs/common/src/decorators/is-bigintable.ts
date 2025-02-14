import type { ValidationOptions, } from "class-validator";
import { registerDecorator, } from "class-validator";

export function isBigintable(value: string,): boolean {
  if (typeof value !== "string") return false;
  try {
    BigInt(value,);
    return true;
  } catch {
    return false;
  }
}

export function IsBigintable(validationOptions?: ValidationOptions,) {
  return (object: Record<string, any>, propertyName: string,) => {
    registerDecorator({
      name: "isBigintable",
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any,) {
          return isBigintable(value,);
        },
      },
    },);
  };
}