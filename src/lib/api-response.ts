import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function serializeBigInt(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") {
    return obj <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(obj) : obj.toString();
  }
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  if (typeof obj === "object") {
    const res: Record<string, unknown> = {};
    const typedObj = obj as Record<string, unknown>;
    for (const key of Object.keys(typedObj)) {
      res[key] = serializeBigInt(typedObj[key]);
    }
    return res;
  }
  return obj;
}

export function successResponse<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  const serializedData = serializeBigInt(data);
  const responseBody = {
    ok: true as const,
    data: serializedData,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  return NextResponse.json(responseBody, { status });
}

export function errorResponse(
  code: string,
  message: string,
  details?: Array<{ path: string; message: string }>,
  status = 400,
  meta?: Record<string, unknown>
) {
  const responseBody = {
    ok: false as const,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  return NextResponse.json(responseBody, { status });
}

export function validationErrorResponse(error: ZodError) {
  const details = error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
  return errorResponse("VALIDATION_ERROR", "Input tidak valid.", details, 400);
}
