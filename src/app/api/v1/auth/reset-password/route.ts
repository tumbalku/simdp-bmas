import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";
import { resetPasswordWithToken } from "@/modules/auth/server";

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token wajib diisi"),
    password: z.string().min(8, "Password baru minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await enforceApiRateLimit(request, API_RATE_LIMIT_CATEGORY.AUTH_PUBLIC);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { token, password } = parsed.data;
    const success = await resetPasswordWithToken(token, password);

    if (!success) {
      return errorResponse(
        "BAD_REQUEST",
        "Token reset tidak valid, telah kedaluwarsa, atau sudah pernah digunakan",
        undefined,
        400
      );
    }

    return successResponse({ success: true });
  } catch (error) {
    console.error("Reset password route error:", error);
    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal", undefined, 500);
  }
}
