export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public details?: Array<{ path: string; message: string }>
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function handleActionError(
  error: unknown,
  options?: {
    unauthenticatedMessage?: string;
    forbiddenMessage?: string;
    defaultMessage?: string;
    overrideInternalCode?: string;
  }
) {
  if (error instanceof AppError) {
    let msg = error.message;
    if (error.code === "UNAUTHENTICATED") {
      msg = options?.unauthenticatedMessage ?? "User belum login";
    } else if (error.code === "FORBIDDEN") {
      msg = options?.forbiddenMessage ?? "Akses ditolak.";
    }
    return {
      ok: false as const,
      error: {
        code: error.code,
        message: msg,
        ...(error.details ? { details: error.details } : {}),
      },
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  const code = error && typeof error === "object" && "code" in error
    ? String((error as Record<string, unknown>).code)
    : undefined;

  if (message === "UNAUTHENTICATED") {
    return {
      ok: false as const,
      error: {
        code: "UNAUTHENTICATED",
        message: options?.unauthenticatedMessage ?? "User belum login",
      },
    };
  }

  if (message === "FORBIDDEN") {
    return {
      ok: false as const,
      error: {
        code: "FORBIDDEN",
        message: options?.forbiddenMessage ?? "Akses ditolak.",
      },
    };
  }

  if (message === "OWNERSHIP_REQUIRED") {
    return {
      ok: false as const,
      error: {
        code: "FORBIDDEN",
        message: message,
      },
    };
  }

  if (message.includes("sudah terdaftar") || message.includes("masih digunakan")) {
    return {
      ok: false as const,
      error: {
        code: "CONFLICT",
        message,
      },
    };
  }

  if (message.includes("APPROVED")) {
    return {
      ok: false as const,
      error: {
        code: "BUSINESS_RULE_VIOLATION",
        message,
      },
    };
  }

  const finalCode = options?.overrideInternalCode || code || "INTERNAL_ERROR";
  const finalMessage = options?.defaultMessage || message || "Terjadi kesalahan internal";

  return {
    ok: false as const,
    error: {
      code: finalCode,
      message: finalMessage,
    },
  };
}
