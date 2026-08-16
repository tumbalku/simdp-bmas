"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadFileWithToast } from "@/utils/download";

type DownloadDocumentsPdfButtonProps = {
  employeeId: string;
  employeeName: string;
};

export function DownloadDocumentsPdfButton({
  employeeId,
  employeeName,
}: DownloadDocumentsPdfButtonProps) {
  return (
    <Button
      variant="default"
      size="sm"
      onClick={() =>
        void downloadFileWithToast({
          url: `/api/v1/employees/${employeeId}/documents-pdf`,
          loadingMessage: `Memproses unduhan dokumen PDF ${employeeName}...`,
          successMessage: `Dokumen PDF ${employeeName} berhasil diunduh.`,
          defaultFilename: `Dokumen_${employeeName}.pdf`,
        })
      }
    >
      <Download className="size-4" />
      Download PDF
    </Button>
  );
}
