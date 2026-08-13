import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export * from "./crypto";
export * from "./date";
export * from "./format";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function bigIntToNumber(value: bigint | number | null | undefined): number | null {
  if (typeof value === "bigint") return Number(value)
  if (typeof value === "number") return value
  return null
}
