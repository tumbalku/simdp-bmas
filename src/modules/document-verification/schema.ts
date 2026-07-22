import { z } from "zod";

export const documentVerificationCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^SIMDP-[A-F0-9]{32}$/, "Kode verifikasi dokumen tidak valid.");

export const verifyDocumentQuerySchema = z.object({
  code: documentVerificationCodeSchema,
});
