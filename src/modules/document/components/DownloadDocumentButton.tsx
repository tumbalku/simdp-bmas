"use client";

import { useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeaderButton } from "@/components/navigation/PageHeader";
import { fetchDocumentPreviewUrl } from "@/modules/document/api";

type DownloadDocumentButtonProps = {
  documentId: string;
};

export function DownloadDocumentButton({ documentId }: DownloadDocumentButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDownload() {
    startTransition(async () => {
      const toastId = toast.loading("Menyiapkan tautan pratinjau dokumen...");
      try {
        const url = await fetchDocumentPreviewUrl(documentId);
        window.open(url, "_blank", "noopener,noreferrer");
        toast.success("Dokumen berhasil dibuka.", { id: toastId });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Gagal membuka dokumen.";
        toast.error(errorMessage, { id: toastId });
      }
    });
  }

  return (
    <PageHeaderButton
      label={isPending ? "Membuka..." : "Unduh"}
      icon={isPending ? Loader2 : Download}
      onClick={handleDownload}
      disabled={isPending}
    />
  );
}
