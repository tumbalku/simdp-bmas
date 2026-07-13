import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import crypto from "crypto";
import { env } from "@/lib/env";
import type { UserRole } from "@/constants/roles";

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

export interface TokenPayload {
  userId: string;
  role: string;
  employeeId?: string | null;
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(JWT_SECRET);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function setAuthCookies(
  userId: string,
  role: string,
  employeeId: string | null,
  refreshTokenPlain: string
) {
  const accessToken = await signAccessToken({ userId, role, employeeId });
  const cookieStore = await cookies();

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 mins
  });

  cookieStore.set("refresh_token", refreshTokenPlain, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth", // Only sent to refresh and logout
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.set("access_token", "", { maxAge: 0, path: "/" });
  cookieStore.set("refresh_token", "", { maxAge: 0, path: "/api/v1/auth" });
}

// Role Hierarchy Helper
export const ROLE_LEVELS = {
  EMPLOYEE: 1,
  STAFF: 2,
  ADMIN: 3,
} as const satisfies Record<UserRole, number>;

export function hasRolePermission(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_LEVELS[userRole as UserRole] || 0;
  const requiredLevel = ROLE_LEVELS[requiredRole as UserRole] || 0;
  return userLevel >= requiredLevel;
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

export async function requireAuth(minRole?: string): Promise<TokenPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  if (minRole && !hasRolePermission(session.role, minRole)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

