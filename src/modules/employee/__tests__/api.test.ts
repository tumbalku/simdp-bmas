import { afterEach, describe, expect, it, vi } from "vitest";

import { uploadProfileAvatarFormData } from "../api";

describe("profile avatar upload API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a user-facing error envelope when the upload endpoint returns a non-json 413", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("Body exceeded 1 MB limit.", {
          status: 413,
          headers: { "content-type": "text/plain" },
        }),
      ),
    );

    const result = await uploadProfileAvatarFormData(new FormData());

    expect(result).toEqual({
      ok: false,
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Ukuran foto profil melebihi batas yang diizinkan.",
      },
    });
  });

  it("preserves json avatar upload 4xx messages from the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            ok: false,
            error: {
              code: "UNSUPPORTED_MEDIA_TYPE",
              message: "Format foto profil harus PNG, JPG, JPEG, atau WEBP.",
            },
          },
          { status: 415 },
        ),
      ),
    );

    const result = await uploadProfileAvatarFormData(new FormData());

    expect(result).toEqual({
      ok: false,
      error: {
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "Format foto profil harus PNG, JPG, JPEG, atau WEBP.",
      },
    });
  });
});
