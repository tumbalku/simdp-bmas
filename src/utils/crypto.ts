import * as crypto from "crypto";

export function generateRandomKey(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

export function generateAlphanumericKey(length: number = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    result += chars.charAt(randomIndex);
  }
  return result;
}

