import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, validationErrorResponse, errorResponse } from "@/lib/api-response";
import { requestPasswordReset } from "@/modules/auth/service";

const forgotPasswordSchema = z.object({
  email: z.email("Format email tidak valid"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { email } = parsed.data;
    await requestPasswordReset(email);

    return successResponse({
      message: "Instruksi reset password telah dikirim ke email Anda jika terdaftar.",
    });
  } catch (error) {
    console.error("Forgot password route error:", error);
    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal", undefined, 500);
  }
}
