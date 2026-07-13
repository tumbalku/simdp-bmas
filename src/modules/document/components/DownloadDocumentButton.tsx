"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type DownloadDocumentButtonProps = {
  documentId: string;
};

export function DownloadDocumentButton({ documentId }: DownloadDocumentButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDownload() {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/v1/documents/download/${documentId}`);
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
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
