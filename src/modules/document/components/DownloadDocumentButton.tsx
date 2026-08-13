"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
    <Button type="button" onClick={handleDownload} disabled={isPending}>
      <Download className="size-4" /> {isPending ? "Membuka..." : "Unduh"}
    </Button>
  );
}
