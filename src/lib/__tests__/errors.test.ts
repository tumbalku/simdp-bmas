import { describe, expect, it } from "vitest";
import { getRegistrationSchemaMissingMessage, handleActionError, isRegistrationSchemaMissingError } from "../errors";

function prismaMissingRegistrationTableError() {
  const error = new Error("The table `public.UserRegistrationRequest` does not exist in the current database.");
  Object.assign(error, { code: "P2021" });
  return error;
}

describe("handleActionError", () => {
  it("maps missing registration staging table to a clear setup message", () => {
    const error = prismaMissingRegistrationTableError();

    expect(isRegistrationSchemaMissingError(error)).toBe(true);
    expect(handleActionError(error)).toEqual({
      ok: false,
      error: {
        code: "REGISTRATION_SCHEMA_NOT_READY",
        message: getRegistrationSchemaMissingMessage(),
      },
    });
  });
});
