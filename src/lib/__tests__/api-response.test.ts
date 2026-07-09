import { describe, it, expect } from "vitest";
import { ZodError } from "zod";
import {
  serializeBigInt,
  successResponse,
  errorResponse,
  validationErrorResponse,
} from "@/lib/api-response";

describe("api-response helper", () => {
  describe("serializeBigInt", () => {
    it("should handle null and undefined", () => {
      expect(serializeBigInt(null)).toBeNull();
      expect(serializeBigInt(undefined)).toBeUndefined();
    });

    it("should convert safe BigInt to Number", () => {
      expect(serializeBigInt(BigInt(42))).toBe(42);
    });

    it("should convert unsafe BigInt to string", () => {
      const unsafe = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(10);
      expect(serializeBigInt(unsafe)).toBe(unsafe.toString());
    });

    it("should convert Date to ISO string", () => {
      const date = new Date("2026-07-09T00:00:00.000Z");
      expect(serializeBigInt(date)).toBe(date.toISOString());
    });

    it("should serialize arrays recursively", () => {
      const arr = [BigInt(1), BigInt(Number.MAX_SAFE_INTEGER + 10)];
      expect(serializeBigInt(arr)).toEqual([1, (Number.MAX_SAFE_INTEGER + 10).toString()]);
    });

    it("should serialize objects recursively", () => {
      const obj = {
        id: BigInt(10),
        nested: {
          val: BigInt(Number.MAX_SAFE_INTEGER + 10),
        },
      };
      expect(serializeBigInt(obj)).toEqual({
        id: 10,
        nested: {
          val: (Number.MAX_SAFE_INTEGER + 10).toString(),
        },
      });
    });
  });

  describe("successResponse", () => {
    it("should return a NextResponse with correct JSON payload", async () => {
      const response = successResponse({ key: BigInt(123) }, { count: 1 }, 201);
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.data).toEqual({ key: 123 });
      expect(body.meta).toBeDefined();
      expect(body.meta.count).toBe(1);
      expect(body.meta.timestamp).toBeDefined();
    });
  });

  describe("errorResponse", () => {
    it("should return a NextResponse with error format", async () => {
      const details = [{ path: "email", message: "Invalid email" }];
      const response = errorResponse("BAD_REQUEST", "Invalid input", details, 400);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("BAD_REQUEST");
      expect(body.error.message).toBe("Invalid input");
      expect(body.error.details).toEqual(details);
    });
  });

  describe("validationErrorResponse", () => {
    it("should transform ZodError and return errorResponse format", async () => {
      const zodError = new ZodError([
        {
          code: "custom",
          path: ["user", "email"],
          message: "Email is required",
        },
      ]);
      const response = validationErrorResponse(zodError);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual([
        { path: "user.email", message: "Email is required" },
      ]);
    });
  });
});
