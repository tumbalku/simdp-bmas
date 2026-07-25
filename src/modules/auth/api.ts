export type RefreshSessionResult = {
  ok: boolean;
  shouldLogout: boolean;
};

export async function refreshSession(): Promise<RefreshSessionResult> {
  try {
    const response = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });

    return {
      ok: response.ok,
      shouldLogout: response.status === 401,
    };
  } catch {
    return { ok: false, shouldLogout: false };
  }
}
