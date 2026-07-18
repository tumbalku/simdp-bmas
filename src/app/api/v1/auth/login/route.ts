import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response";
import { loginUser } from "@/modules/auth/server";
import { setAuthCookies } from "@/lib/auth";

const loginSchema = z.object({
  identifier: z.string().min(1, "Identifier wajib diisi"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { identifier, password } = parsed.data;
    const ipAddress = request.headers.get("x-forwarded-for") || null;
    const userAgent = request.headers.get("user-agent") || null;

    const result = await loginUser(identifier, password, ipAddress, userAgent);

    if (!result) {
      return errorResponse("UNAUTHENTICATED", "Identifier atau password salah", undefined, 401);
    }

    await setAuthCookies(
      result.user.id,
      result.user.role,
      result.user.employeeId,
      result.refreshTokenPlain
    );

    return successResponse({ user: result.user });
  } catch (error) {
    console.error("Login route error:", error);
    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan internal", undefined, 500);
  }
}
