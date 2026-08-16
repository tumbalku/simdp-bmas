import { toast } from "sonner";

export type DownloadFileOptions = {
  url: string;
  loadingMessage?: string;
  successMessage?: string;
  defaultFilename?: string;
  openInNewTab?: boolean;
};

export async function downloadFileWithToast({
  url,
  loadingMessage = "Memproses unduhan berkas...",
  successMessage = "Berkas berhasil diunduh.",
  defaultFilename = "berkas.pdf",
  openInNewTab = false,
}: DownloadFileOptions): Promise<boolean> {
  const toastId = toast.loading(loadingMessage);

  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "same-origin",
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData.error?.message ||
          errorData.message ||
          `Gagal mengunduh berkas (${response.status}).`;
        throw new Error(message);
      } else {
        if (response.status === 429) {
          throw new Error("Terlalu banyak permintaan unduh. Silakan tunggu beberapa saat.");
        }
        throw new Error(`Terjadi kesalahan (${response.status}) saat mengunduh berkas.`);
      }
    }

    if (openInNewTab) {
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30_000);
      toast.success(successMessage, { id: toastId });
      return true;
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = defaultFilename;

    if (contentDisposition) {
      const match = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^;'"]+)['"]?/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
    }

    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);

    toast.success(successMessage, { id: toastId });
    return true;
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Gagal terhubung ke server untuk mengunduh berkas.";
    toast.error(errorMessage, { id: toastId });
    console.error("Download error:", err);
    return false;
  }
}
