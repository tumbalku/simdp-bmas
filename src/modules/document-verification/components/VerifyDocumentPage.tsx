import { AlertCircle, CheckCircle2, FileQuestion, ShieldCheck, XCircle } from "lucide-react";

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
      icon: CheckCircle2,
      badgeClassName: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    };
  }

  if (status === "REVOKED") {
    return {
      title: "Dokumen dicabut",
      description: "Dokumen ini pernah diterbitkan, tetapi status verifikasinya sudah dicabut.",
      icon: XCircle,
      badgeClassName: "bg-destructive/10 text-destructive ring-1 ring-destructive/20",
    };
  }

  if (status === "EXPIRED") {
    return {
      title: "Dokumen kedaluwarsa",
      description: "Kode ini terdaftar, tetapi masa berlaku verifikasinya sudah berakhir.",
      icon: AlertCircle,
      badgeClassName: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    };
  }

  return {
    title: "Dokumen tidak ditemukan",
    description: "Kode ini tidak cocok dengan dokumen verifikasi yang tersimpan di SiCantIK.",
    icon: FileQuestion,
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

export function VerifyDocumentPage({ result, error }: VerifyDocumentPageProps) {
  const copy = result ? statusCopy(result.status) : null;
  const Icon = copy?.icon ?? FileQuestion;

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">SiCantIK</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Verifikasi Dokumen</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Halaman publik untuk memeriksa apakah dokumen profil pegawai diterbitkan oleh SIMDP RSUD Bahteramas.
          </p>
        </div>

        <Card className="border-border/80">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-muted">
              <Icon className="size-7" />
            </div>
            <CardTitle className="text-xl">{error || copy?.title || "Masukkan kode verifikasi"}</CardTitle>
            <CardDescription>
              {error ||
                copy?.description ||
                "Scan QR Code pada PDF profil pegawai atau buka link verifikasi yang tertera di dokumen."}
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
                <DetailRow label="Kode Verifikasi" value={result.code} />
                <DetailRow label="Jenis Dokumen" value={result.documentTypeLabel} />
                <DetailRow label="Nama Pegawai" value={result.subjectName} />
                <DetailRow label="Identifier" value={result.subjectIdentifier} />
                <DetailRow label="Jabatan" value={result.employeePosition} />
                <DetailRow label="Unit Kerja" value={result.workplace} />
                <DetailRow label="Tanggal Terbit" value={formatDate(result.issuedAt)} />
                <DetailRow label="Berlaku Sampai" value={formatDate(result.expiresAt)} />
              </div>

              {result.revokedAt ? (
                <DetailRow label="Tanggal Dicabut" value={formatDate(result.revokedAt)} />
              ) : null}

              {result.fileHash ? (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">SHA-256 File</div>
                  <div className="mt-1 break-all font-mono text-xs text-foreground">{result.fileHash}</div>
                </div>
              ) : null}

              <p className="text-xs leading-5 text-muted-foreground">
                Verifikasi ini hanya membuktikan bahwa kode dokumen terdaftar di SiCantIK. Jika tampilan dokumen fisik/PDF
                berbeda dari data di halaman ini, mintalah dokumen ulang dari administrator.
              </p>
            </CardContent>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
