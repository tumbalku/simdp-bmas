import { z } from "zod";
import { REGISTRATION_OTP_LENGTH, REGISTRATION_STATUS } from "./constants";

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);

const identitySchema = z
  .object({
    nik: optionalTrimmedString.pipe(z.string().regex(/^\d{16}$/, "NIK harus 16 digit").optional()),
    claimedNip: optionalTrimmedString.pipe(z.string().regex(/^\d{10,32}$/, "NIP minimal 10 digit").optional()),
  })
  .refine((value) => Boolean(value.nik || value.claimedNip), {
    message: "Isi minimal salah satu: NIK atau NIP.",
    path: ["nik"],
  });

export const submitRegistrationSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Format email tidak valid"),
    name: z.string().trim().min(2, "Nama minimal 2 karakter").max(120, "Nama terlalu panjang"),
    password: z.string().min(8, "Password minimal 8 karakter").max(128, "Password terlalu panjang"),
    confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter").max(128, "Konfirmasi password terlalu panjang"),
    phone: optionalTrimmedString.pipe(z.string().regex(/^[0-9+\-\s]{6,32}$/, "Format nomor HP tidak valid").optional()),
  })
  .and(identitySchema)
  .refine((value) => value.password === value.confirmPassword, {
    message: "Konfirmasi password tidak sesuai.",
    path: ["confirmPassword"],
  });

export const verifyRegistrationOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  otp: z.string().trim().regex(new RegExp(`^\\d{${REGISTRATION_OTP_LENGTH}}$`), "Kode OTP harus 6 digit"),
});

export const listRegistrationRequestsSchema = z.object({
  status: z.enum([
    REGISTRATION_STATUS.EMAIL_PENDING,
    REGISTRATION_STATUS.EMAIL_VERIFIED,
    REGISTRATION_STATUS.UNDER_REVIEW,
    REGISTRATION_STATUS.APPROVED,
    REGISTRATION_STATUS.REJECTED,
    "ALL",
  ]).optional().default(REGISTRATION_STATUS.UNDER_REVIEW),
  search: z.string().trim().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});

export const reviewRegistrationSchema = z.object({
  id: z.string().min(1, "ID registrasi wajib diisi"),
});

export type SubmitRegistrationInput = z.infer<typeof submitRegistrationSchema>;
export type VerifyRegistrationOtpInput = z.infer<typeof verifyRegistrationOtpSchema>;
export type ListRegistrationRequestsInput = z.infer<typeof listRegistrationRequestsSchema>;
