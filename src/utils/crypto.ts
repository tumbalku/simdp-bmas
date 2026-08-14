export function generateRandomKey(length: number = 32): string {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, length * 2);
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require("crypto");
    return nodeCrypto.randomBytes(length).toString("hex");
  } catch {
    const hex = "0123456789abcdef";
    let result = "";
    for (let i = 0; i < length * 2; i++) {
      result += hex[Math.floor(Math.random() * 16)];
    }
    return result;
  }
}

export function generateAlphanumericKey(length: number = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(length);
    globalThis.crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += chars.charAt(values[i] % chars.length);
    }
    return result;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require("crypto");
    if (typeof nodeCrypto.randomInt === "function") {
      for (let i = 0; i < length; i++) {
        result += chars.charAt(nodeCrypto.randomInt(0, chars.length));
      }
      return result;
    }
  } catch {
    // Fallback to Math.random below
  }

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
