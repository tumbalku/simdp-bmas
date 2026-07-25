import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import crypto from "crypto";
import { env } from "@/lib/env";
import type { UserRole } from "@/constants/roles";
import { AppError } from "./errors";

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);
export const ACCESS_TOKEN_TTL_SECONDS = 30 * 60;

export interface TokenPayload {
  userId: string;
  role: string;
  employeeId?: string | null;
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(JWT_SECRET);
}

export async function createTwoFactorChallenge(userId: string): Promise<string> {
  return new SignJWT({ userId, purpose: "2fa-login" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(JWT_SECRET);
}

export async function verifyTwoFactorChallenge(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.purpose === "2fa-login" && typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}

export async function setTwoFactorChallengeCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set("two_factor_challenge", await createTwoFactorChallenge(userId), {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 5 * 60,
  });
}

export async function getTwoFactorChallengeUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("two_factor_challenge")?.value;
  return token ? verifyTwoFactorChallenge(token) : null;
}

export async function clearTwoFactorChallengeCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("two_factor_challenge");
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
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
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
    throw new AppError("UNAUTHENTICATED", "UNAUTHENTICATED", 401);
  }
  if (minRole && !hasRolePermission(session.role, minRole)) {
    throw new AppError("FORBIDDEN", "FORBIDDEN", 403);
  }
  return session;
}

