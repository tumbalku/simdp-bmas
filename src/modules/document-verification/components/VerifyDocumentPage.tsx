import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { PublicDocumentVerificationResult } from "../types";

type VerifyDocumentPageProps = {
  result: PublicDocumentVerificationResult | null;
  error?: string;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(date);
}

function statusCopy(status: PublicDocumentVerificationResult["status"]) {
  if (status === "VALID") {
    return {
      title: "Dokumen valid",
      description: "Kode QR ini terdaftar sebagai dokumen resmi yang diterbitkan oleh SiCantIK.",
      badgeClassName: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    };
  }

  if (status === "REVOKED") {
    return {
      title: "Dokumen dicabut",
      description: "Dokumen ini pernah diterbitkan, tetapi status verifikasinya sudah dicabut.",
      badgeClassName: "bg-destructive/10 text-destructive ring-1 ring-destructive/20",
    };
  }

  if (status === "EXPIRED") {
    return {
      title: "Dokumen kedaluwarsa",
      description: "Kode ini terdaftar, tetapi masa berlaku verifikasinya sudah berakhir.",
      badgeClassName: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    };
  }

  return {
    title: "Dokumen tidak ditemukan",
    description: "Kode ini tidak cocok dengan dokumen verifikasi yang tersimpan di SiCantIK.",
    badgeClassName: "bg-muted text-muted-foreground ring-1 ring-border",
  };
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-foreground">{value || "-"}</div>
    </div>
  );
}

function buildDetailRows(result: PublicDocumentVerificationResult) {
  const rows = [
    { label: "Kode Verifikasi", value: result.code, always: true },
    { label: "Jenis Dokumen", value: result.documentTypeLabel, always: true },
    { label: "Subjek Dokumen", value: result.subjectName, always: true },
    { label: "Identifier", value: result.subjectIdentifier },
    { label: "Jabatan", value: result.employeePosition },
    { label: "Unit Kerja", value: result.workplace },
    { label: "Tanggal Terbit", value: formatDate(result.issuedAt), always: true },
    { label: "Berlaku Sampai", value: result.expiresAt ? formatDate(result.expiresAt) : null },
    { label: "Hash File PDF", value: result.fileHash },
  ];

  return rows.filter((row) => row.always || row.value);
}

export function VerifyDocumentPage({ result, error }: VerifyDocumentPageProps) {
  const copy = result ? statusCopy(result.status) : null;
  const detailRows = result ? buildDetailRows(result) : [];

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="text-center">
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Verifikasi Dokumen</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Halaman untuk memeriksa dokumen diterbitkan oleh SiCantIK RSUD Bahteramas.
          </p>
        </div>

        <Card className="border-border/80">
          <CardHeader className="items-center text-center">
            <CardTitle className="text-xl">{error || copy?.title || "Masukkan kode verifikasi"}</CardTitle>
            <CardDescription>
              {error ||
                copy?.description ||
                "Scan QR Code pada PDF pegawai atau buka link verifikasi yang tertera di dokumen."}
            </CardDescription>
            {result ? (
              <div className="flex w-full justify-center">
                <Badge className={copy?.badgeClassName} variant="outline">
                  {copy?.title}
                </Badge>
              </div>
            ) : null}
          </CardHeader>

          {result ? (
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {detailRows.map((row) => (
                  <DetailRow key={row.label} label={row.label} value={row.value} />
                ))}
              </div>

              {result.revokedAt ? (
                <DetailRow label="Tanggal Dicabut" value={formatDate(result.revokedAt)} />
              ) : null}

              <p className="text-xs leading-5 text-muted-foreground">
                Verifikasi ini membuktikan bahwa kode QR terdaftar di SiCantIK dan dapat digunakan untuk mengecek
                apakah PDF diterbitkan oleh sistem. Cocokkan jenis dokumen, subjek, tanggal terbit, dan hash file PDF
                bila tersedia. Jika tampilan dokumen fisik/PDF berbeda dari data di halaman ini, mintalah dokumen ulang
                dari administrator.
              </p>
            </CardContent>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
