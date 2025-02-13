import { type Address,getAddress,  } from "viem";
import {
  l2BaseTokenAddress,
  legacyEthAddress,
} from "viem/zksync";

const NativeTokenAddresses: Address[] = [
  getAddress(legacyEthAddress,),
  getAddress(l2BaseTokenAddress,),
];
export const isNativeTokenAddress = (address: Address,) => NativeTokenAddresses.includes(address,);

// Only compares that values of a are present and equal in b, not that all keys are equal
export const areObjectFieldsEqual = (a: Record<string, any>, b: Record<string, any>,) => {
  return Object.keys(a,).every((key,) => a[key] === b[key],);
};