"use client";

import { useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
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
    <Button
      onClick={handleDownload}
      disabled={isPending}
      aria-label={isPending ? "Membuka..." : "Unduh"}
      className="size-10 p-0 sm:size-auto sm:h-8 sm:px-2.5"
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Download className="size-3.5" />
      )}
      <span className="hidden sm:inline">
        {isPending ? "Membuka..." : "Unduh"}
      </span>
    </Button>
  );
}
