import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { DownloadDocumentButton } from "@/modules/document/components/DownloadDocumentButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DocumentDetail = {
  id: string;
  title: string;
  status: string;
  uploadedAt: string;
  expiryDate: string | null;
  issueDate: string | null;
  documentNumber: string | null;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  documentTypeName: string;
  archiveCategory: string;
  ownerName: string;
  ownerEmployeeId: string | null;
  verificationHistories: Array<{ id: string; status: string; reviewNote: string | null; reviewedAt: string | null; reviewerName: string }>;
};

type DocumentDetailViewProps = {
  document: DocumentDetail;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatFileSize(value: number | null) {
  if (!value) return "-";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentDetailView({ document }: DocumentDetailViewProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/documents"
        backLabel="Kembali ke dokumen"
        title={document.title}
        description={`${document.documentTypeName} milik ${document.ownerName}`}
        trailing={<DownloadDocumentButton documentId={document.id} />}
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="size-5" /> Metadata dokumen</CardTitle>
            <CardDescription>Informasi file, tanggal, dan status verifikasi.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Info label="Status" value={<Badge>{document.status}</Badge>} />
            <Info label="Kategori arsip" value={document.archiveCategory} />
            <Info label="Nama file" value={document.fileName} />
            <Info label="Ukuran" value={formatFileSize(document.fileSize)} />
            <Info label="Nomor dokumen" value={document.documentNumber || "-"} />
            <Info label="MIME" value={document.mimeType || "-"} />
            <Info label="Tanggal upload" value={formatDate(document.uploadedAt)} />
            <Info label="Tanggal terbit" value={formatDate(document.issueDate)} />
            <Info label="Tanggal kedaluwarsa" value={formatDate(document.expiryDate)} />
            <Info label="Pemilik" value={`${document.ownerName} · ${document.ownerEmployeeId || "NIP belum ada"}`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat verifikasi</CardTitle>
            <CardDescription>Jejak status terakhir dokumen.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {document.verificationHistories.map((history) => (
              <div key={history.id} className="space-y-2 rounded-xl border p-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline">{history.status}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(history.reviewedAt)}</span>
                </div>
                <p className="text-sm">{history.reviewNote || "Tidak ada catatan."}</p>
                <p className="text-xs text-muted-foreground">Reviewer: {history.reviewerName}</p>
              </div>
            ))}
            {document.verificationHistories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada riwayat verifikasi.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1 rounded-xl border bg-muted/20 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
