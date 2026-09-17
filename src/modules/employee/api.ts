type ErrorEnvelope = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

type ProfileAvatarPayload = {
  ok: true;
  data: {
    avatarUrl: string;
  };
};

export type ProfileAvatarUploadResult = ProfileAvatarPayload | ErrorEnvelope;

function getFallbackAvatarUploadErrorMessage(status: number) {
  if (status === 413) return "Ukuran foto profil melebihi batas yang diizinkan.";
  if (status === 415) return "Format foto profil harus PNG, JPG, JPEG, atau WEBP.";
  if (status === 422) return "Input foto profil tidak valid.";
  if (status >= 500) return "Terjadi kesalahan internal saat upload foto profil.";
  return `Upload foto profil gagal (${status}).`;
}

async function readJsonEnvelope(response: Response) {
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) return null;

  try {
    return (await response.json()) as ProfileAvatarUploadResult;
  } catch {
    return null;
  }
}

export async function uploadProfileAvatarFormData(
  formData: FormData,
): Promise<ProfileAvatarUploadResult> {
  const response = await fetch("/api/v1/profile/avatar", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await readJsonEnvelope(response);

  if (!response.ok) {
    return payload?.ok === false
      ? payload
      : {
          ok: false,
          error: {
            code: response.status === 413 ? "PAYLOAD_TOO_LARGE" : "UPLOAD_FAILED",
            message: getFallbackAvatarUploadErrorMessage(response.status),
          },
        };
  }

  if (payload) return payload;

  return {
    ok: false,
    error: {
      code: "INVALID_RESPONSE",
      message: "Response upload foto profil tidak valid.",
    },
  };
}
