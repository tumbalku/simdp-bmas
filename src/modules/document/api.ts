type PreviewUrlPayload = {
  ok: true;
  data: {
    url: string;
  };
};

type ErrorEnvelope = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

export async function fetchDocumentPreviewUrl(documentId: string) {
  const response = await fetch(`/api/v1/documents/download/${documentId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "same-origin",
  });

  const payload = (await response.json()) as PreviewUrlPayload | ErrorEnvelope;

  if (!response.ok) {
    const message = payload.ok ? "Gagal membuka dokumen." : payload.error.message;
    throw new Error(message);
  }

  if (!payload.ok) {
    throw new Error(payload.error.message);
  }

  return payload.data.url;
}
