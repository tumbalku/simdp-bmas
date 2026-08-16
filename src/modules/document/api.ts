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
    const message = payload.ok
      ? "Gagal membuka dokumen."
      : payload.error.message;
    throw new Error(message);
  }

  if (!payload.ok) {
    throw new Error(payload.error.message);
  }

  return payload.data.url;
}

export async function downloadMasterDataDocumentsPdf(url: string) {
  const response = await fetch(url, {
    method: "GET",
    credentials: "same-origin",
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json();
      const message =
        errorData.error?.message || "Terjadi kesalahan saat mengunduh PDF.";
      throw new Error(message);
    } else {
      throw new Error(
        `Terjadi kesalahan (${response.status}) saat mengunduh PDF.`,
      );
    }
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = "Laporan_Dokumen_Pegawai.pdf";
  if (contentDisposition) {
    // Prefer filename* (RFC 5987) if present
    const filenameStarMatch = /filename\*=UTF-8''([^;\n]+)/i.exec(contentDisposition);
    if (filenameStarMatch) {
      filename = decodeURIComponent(filenameStarMatch[1]);
    } else {
      const filenameMatch = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i.exec(contentDisposition);
      if (filenameMatch?.[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
      }
    }
  }

  return { blob, filename };
}
