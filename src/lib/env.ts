import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional(),
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

    RESEND_API_KEY: optionalString,
    EMAIL_FROM: optionalString,
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
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const formattedErrors = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(`Environment variable SIMDP tidak valid:\n${formattedErrors}`);
}

export const env = parsedEnv.data;

export type Env = typeof env;
