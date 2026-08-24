import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional(),
);

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) return undefined;
  if (typeof value === "number") return value;
  return Number(value);
}, z.number().int().positive().optional());

const optionalBoolean = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
}, z.boolean().optional());

const emailProviderSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.enum(["noop", "resend", "smtp"]).default("noop"),
);

const malwareScannerProviderSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.enum(["noop", "clamav"]).default("clamav"),
);

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL wajib diisi")
      .regex(
        /^postgres(ql)?:\/\//,
        "DATABASE_URL harus berupa connection string PostgreSQL",
      ),
    DIRECT_URL: optionalString,

    STORAGE_PROVIDER: z.enum(["local", "supabase", "s3"]).default("local"),
    DEPLOYMENT_CONTEXT: z
      .enum(["vercel-supabase", "vps-local", "hybrid"])
      .default("hybrid"),
    SUPABASE_URL: optionalUrl,
    SUPABASE_SERVICE_ROLE_KEY: optionalString,
    SUPABASE_STORAGE_BUCKET: optionalString.default("employee-documents"),
    S3_ENDPOINT: optionalUrl,
    S3_REGION: optionalString,
    S3_BUCKET: optionalString,
    S3_ACCESS_KEY_ID: optionalString,
    S3_SECRET_ACCESS_KEY: optionalString,

    JWT_SECRET: z.string().min(1, "JWT_SECRET wajib diisi"),
    REFRESH_TOKEN_SECRET: z
      .string()
      .min(1, "REFRESH_TOKEN_SECRET wajib diisi"),
    CRON_SECRET: z.string().min(1, "CRON_SECRET wajib diisi"),

    MALWARE_SCANNER_PROVIDER: malwareScannerProviderSchema,
    CLAMAV_HOST: optionalString.default("127.0.0.1"),
    CLAMAV_PORT: optionalNumber.default(3310),
    CLAMAV_TIMEOUT_MS: optionalNumber.default(10000),

    BACKUP_ENABLED: optionalBoolean.default(false),
    BACKUP_DB_ENABLED: optionalBoolean.default(true),
    BACKUP_STORAGE_ENABLED: optionalBoolean.default(true),
    BACKUP_ENCRYPTION_ENABLED: optionalBoolean.default(false),
    BACKUP_TARGET: z.enum(["local", "folder", "gdrive", "s3"]).default("local"),
    BACKUP_LOCAL_DIR: optionalString,
    BACKUP_FOLDER_PATH: optionalString,
    BACKUP_RETENTION_DAILY_DAYS: optionalNumber.default(14),
    BACKUP_RETENTION_WEEKLY_DAYS: optionalNumber.default(56),
    BACKUP_RETENTION_MONTHLY_DAYS: optionalNumber.default(365),
    SIMDP_BACKUP_ALLOW_UNENCRYPTED: optionalBoolean.default(false),
    GDRIVE_FOLDER_ID: optionalString,
    GDRIVE_CLIENT_EMAIL: optionalString,
    GDRIVE_PRIVATE_KEY: optionalString,

    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
    GOOGLE_OAUTH_REDIRECT_URI: optionalUrl,

    EMAIL_PROVIDER: emailProviderSchema,
    RESEND_API_KEY: optionalString,
    EMAIL_FROM: optionalString,
    SMTP_HOST: optionalString,
    SMTP_PORT: optionalNumber,
    SMTP_SECURE: optionalBoolean,
    SMTP_USER: optionalString,
    SMTP_PASS: optionalString,
    PUSHER_APP_ID: optionalString,
    PUSHER_KEY: optionalString,
    PUSHER_SECRET: optionalString,
    PUSHER_CLUSTER: optionalString,
    NEXT_PUBLIC_PUSHER_KEY: optionalString,
    NEXT_PUBLIC_PUSHER_CLUSTER: optionalString,
    INNGEST_EVENT_KEY: optionalString,
    INNGEST_SIGNING_KEY: optionalString,
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  })
  .superRefine((env, context) => {
    if (env.STORAGE_PROVIDER === "supabase") {
      if (!env.SUPABASE_URL) {
        context.addIssue({
          code: "custom",
          path: ["SUPABASE_URL"],
          message: "SUPABASE_URL wajib diisi saat STORAGE_PROVIDER=supabase",
        });
      }

      if (!env.SUPABASE_SERVICE_ROLE_KEY) {
        context.addIssue({
          code: "custom",
          path: ["SUPABASE_SERVICE_ROLE_KEY"],
          message:
            "SUPABASE_SERVICE_ROLE_KEY wajib diisi saat STORAGE_PROVIDER=supabase",
        });
      }
    }

    if (env.STORAGE_PROVIDER === "s3") {
      for (const key of [
        "S3_REGION",
        "S3_BUCKET",
        "S3_ACCESS_KEY_ID",
        "S3_SECRET_ACCESS_KEY",
      ] as const) {
        if (!env[key]) {
          context.addIssue({
            code: "custom",
            path: [key],
            message: `${key} wajib diisi saat STORAGE_PROVIDER=s3`,
          });
        }
      }
    }

    if (env.BACKUP_ENABLED) {
      if (
        env.DEPLOYMENT_CONTEXT === "vercel-supabase" &&
        env.STORAGE_PROVIDER === "local"
      ) {
        context.addIssue({
          code: "custom",
          path: ["STORAGE_PROVIDER"],
          message:
            "STORAGE_PROVIDER=local tidak cocok dengan DEPLOYMENT_CONTEXT=vercel-supabase",
        });
      }

      if (
        env.DEPLOYMENT_CONTEXT === "vercel-supabase" &&
        (env.BACKUP_TARGET === "local" || env.BACKUP_TARGET === "folder")
      ) {
        context.addIssue({
          code: "custom",
          path: ["BACKUP_TARGET"],
          message:
            "DEPLOYMENT_CONTEXT=vercel-supabase tidak boleh bergantung pada filesystem runtime; gunakan BACKUP_TARGET=gdrive sebagai target utama",
        });
      }

      if (
        env.DEPLOYMENT_CONTEXT === "vps-local" &&
        env.STORAGE_PROVIDER !== "local"
      ) {
        context.addIssue({
          code: "custom",
          path: ["STORAGE_PROVIDER"],
          message:
            "DEPLOYMENT_CONTEXT=vps-local mengharapkan STORAGE_PROVIDER=local",
        });
      }

      if (env.BACKUP_TARGET === "local" && !env.BACKUP_LOCAL_DIR) {
        context.addIssue({
          code: "custom",
          path: ["BACKUP_LOCAL_DIR"],
          message: "BACKUP_LOCAL_DIR wajib diisi saat BACKUP_TARGET=local",
        });
      }

      if (env.BACKUP_TARGET === "folder" && !env.BACKUP_FOLDER_PATH) {
        context.addIssue({
          code: "custom",
          path: ["BACKUP_FOLDER_PATH"],
          message: "BACKUP_FOLDER_PATH wajib diisi saat BACKUP_TARGET=folder",
        });
      }

      if (env.BACKUP_TARGET === "gdrive") {
        for (const key of [
          "GDRIVE_FOLDER_ID",
          "GDRIVE_CLIENT_EMAIL",
          "GDRIVE_PRIVATE_KEY",
        ] as const) {
          if (!env[key]) {
            context.addIssue({
              code: "custom",
              path: [key],
              message: `${key} wajib diisi saat BACKUP_TARGET=gdrive`,
            });
          }
        }
      }

      if (env.BACKUP_TARGET === "s3") {
        for (const key of [
          "S3_REGION",
          "S3_BUCKET",
          "S3_ACCESS_KEY_ID",
          "S3_SECRET_ACCESS_KEY",
        ] as const) {
          if (!env[key]) {
            context.addIssue({
              code: "custom",
              path: [key],
              message: `${key} wajib diisi saat BACKUP_TARGET=s3`,
            });
          }
        }
      }

      if (
        env.NODE_ENV === "production" &&
        env.BACKUP_TARGET === "local" &&
        !env.BACKUP_ENCRYPTION_ENABLED &&
        !env.SIMDP_BACKUP_ALLOW_UNENCRYPTED
      ) {
        context.addIssue({
          code: "custom",
          path: ["BACKUP_ENCRYPTION_ENABLED"],
          message:
            "Backup production ke target local wajib dienkripsi sebelum disalin offsite. Untuk drill lokal saja, set SIMDP_BACKUP_ALLOW_UNENCRYPTED=true",
        });
      }
    }

    const isProductionRuntime =
      env.NODE_ENV === "production" &&
      process.env.NEXT_PHASE !== "phase-production-build";

    if (isProductionRuntime && !env.INNGEST_SIGNING_KEY) {
      context.addIssue({
        code: "custom",
        path: ["INNGEST_SIGNING_KEY"],
        message: "INNGEST_SIGNING_KEY wajib diisi di runtime production untuk verifikasi webhook Inngest",
      });
    }

    // Aturan ini dinonaktifkan agar deployment di Vercel (free tier) bisa menggunakan MALWARE_SCANNER_PROVIDER=noop jika diinginkan.
    // const isProductionRuntime =
    //   env.NODE_ENV === "production" &&
    //   process.env.NEXT_PHASE !== "phase-production-build";
    //
    // if (env.MALWARE_SCANNER_PROVIDER === "noop" && isProductionRuntime) {
    //   context.addIssue({
    //     code: "custom",
    //     path: ["MALWARE_SCANNER_PROVIDER"],
    //     message: "MALWARE_SCANNER_PROVIDER=noop tidak diizinkan di lingkungan production",
    //   });
    // }
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const formattedErrors = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(`Environment variable SiCantIK tidak valid:\n${formattedErrors}`);
}

export const env = parsedEnv.data;

export type Env = typeof env;
