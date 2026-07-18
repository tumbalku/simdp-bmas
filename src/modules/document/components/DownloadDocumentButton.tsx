"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDocumentPreviewUrlAction } from "@/modules/document/actions";

type DownloadDocumentButtonProps = {
  documentId: string;
};

export function DownloadDocumentButton({ documentId }: DownloadDocumentButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDownload() {
    setMessage(null);
    startTransition(async () => {
      const payload = await getDocumentPreviewUrlAction(documentId);
      if (!payload.ok) {
        setMessage(payload.error?.message || "Gagal membuka dokumen.");
        return;
      }

      window.open(payload.data.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={handleDownload} disabled={isPending}>
        <Download className="size-4" /> {isPending ? "Membuka..." : "Unduh"}
      </Button>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </div>
  );
}
