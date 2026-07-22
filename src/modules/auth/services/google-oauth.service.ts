import {
  authorizationCodeGrant,
  calculatePKCECodeChallenge,
  ClientSecretPost,
  discovery,
  randomNonce,
  randomPKCECodeVerifier,
  randomState,
  buildAuthorizationUrl,
  type Configuration,
} from "openid-client";

import { env } from "@/lib/env";
import { logActivity, SECURITY_ACTOR_ROLE, SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import * as repo from "../repositories/common";

const GOOGLE_ISSUER = new URL("https://accounts.google.com");
const GOOGLE_CALLBACK_PATH = "/api/v1/auth/google/callback";

let googleConfigurationPromise: Promise<Configuration> | null = null;

export function isGoogleOAuthConfigured() {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_OAUTH_REDIRECT_URI);
}

function assertGoogleOAuthConfigured() {
  if (!isGoogleOAuthConfigured()) throw new Error("GOOGLE_OAUTH_NOT_CONFIGURED");
}

function getGoogleRedirectUri() {
  return env.GOOGLE_OAUTH_REDIRECT_URI ?? new URL(GOOGLE_CALLBACK_PATH, env.NEXT_PUBLIC_APP_URL).toString();
}

async function getGoogleConfiguration() {
  assertGoogleOAuthConfigured();
  if (!googleConfigurationPromise) {
    googleConfigurationPromise = discovery(
      GOOGLE_ISSUER,
      env.GOOGLE_CLIENT_ID!,
      { redirect_uris: [getGoogleRedirectUri()], response_types: ["code"] },
      // Google documents the client_secret in the token request body.
      ClientSecretPost(env.GOOGLE_CLIENT_SECRET!),
    );
  }
  return googleConfigurationPromise;
}

export async function createGoogleAuthorizationRequest() {
  const configuration = await getGoogleConfiguration();
  const state = randomState();
  const nonce = randomNonce();
  const codeVerifier = randomPKCECodeVerifier();
  const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
  const authorizationUrl = buildAuthorizationUrl(configuration, {
    redirect_uri: getGoogleRedirectUri(),
    scope: "openid email profile",
    response_type: "code",
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return { authorizationUrl, state, nonce, codeVerifier };
}

export async function resolveGoogleCallback(input: {
  request: Request;
  expectedState: string;
  expectedNonce: string;
  codeVerifier: string;
}) {
  const configuration = await getGoogleConfiguration();
  const tokens = await authorizationCodeGrant(configuration, input.request, {
    expectedState: input.expectedState,
    expectedNonce: input.expectedNonce,
    pkceCodeVerifier: input.codeVerifier,
  });
  const claims = tokens.claims() as { sub?: string; email?: string; email_verified?: boolean } | undefined;

  if (!claims?.sub || !claims.email || claims.email_verified !== true) {
    throw new Error("GOOGLE_IDENTITY_INVALID");
  }

  const user = await repo.findUserWithEmployeeByEmail(claims.email.toLowerCase());
  if (!user || !user.isActive || user.deletedAt) throw new Error("GOOGLE_ACCOUNT_NOT_FOUND");

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id ?? null,
    },
    googleSubject: claims.sub,
  };
}

export async function logGoogleLoginFailure(reason: string, ipAddress?: string | null) {
  await logActivity({
    actorName: "Google OAuth",
    actorRole: SECURITY_ACTOR_ROLE.PUBLIC,
    eventType: SECURITY_EVENT_TYPE.AUTH_GOOGLE_LOGIN_FAILED,
    resource: "GoogleOAuth",
    ipAddress,
    status: SECURITY_LOG_STATUS.FAILED,
    metadata: { reason },
  });
}

export async function logGoogleLoginSuccess(userId: string, actorName: string, actorRole: string, ipAddress?: string | null) {
  await logActivity({
    actorId: userId,
    actorName,
    actorRole,
    eventType: SECURITY_EVENT_TYPE.AUTH_GOOGLE_LOGIN_SUCCESS,
    resource: `User:${userId}`,
    ipAddress,
    status: SECURITY_LOG_STATUS.SUCCESS,
  });
}
