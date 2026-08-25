"use client";

import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  FileWarning,
  ShieldCheck,
} from "lucide-react";
import { CardContainer } from "@/components/cards/CardContainer";
import { DocumentCompletenessProgress } from "@/components/cards/DocumentCompletenessProgress";

import { MetricCard } from "@/components/cards/MetricCard";
import { PageHeader } from "@/components/navigation/PageHeader";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DATE_FORMATS, DATE_LOCALE, routeTo } from "@/constants";
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_VARIANTS,
  type DocumentStatus,
} from "@/modules/document";
import { cn } from "@/utils";

type RecentUpload = {
  id: string;
  documentName: string;
  category: string;
  status: DocumentStatus;
  uploadedAt: string;
  expiryDate: string | null;
};

type ExpiringDocument = {
  id: string;
  documentName: string;
  expiryDate: string;
  daysRemaining: number;
};

type EmployeeDashboardStats = {
  totalSubmitted: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  recentUploads: RecentUpload[];
  expiringDocuments: ExpiringDocument[];
  mandatoryDocumentCompleted: number;
  mandatoryDocumentTotal: number;
};

type EmployeeDashboardViewProps = {
  stats: EmployeeDashboardStats;
};

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMATS.date).format(
    new Date(value),
  );
}

function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <Badge variant={DOCUMENT_STATUS_VARIANTS[status]} className="whitespace-nowrap">
      {DOCUMENT_STATUS_LABELS[status]}
    </Badge>
  );
}

function EmptyRecentDocuments() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileText className="size-6" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">Belum ada dokumen</h3>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        Dokumen yang baru Anda unggah akan muncul di sini agar mudah dipantau.
      </p>
    </div>
  );
}

function ExpiryWarningCard({ documents }: { documents: ExpiringDocument[] }) {
  return (
    <CardContainer
      title="Peringatan kedaluwarsa"
      description="Dokumen aktif yang akan habis masa berlaku dalam 30 hari."
    >
      {documents.length === 0 ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">
                Tidak ada dokumen yang akan kedaluwarsa dalam 30 hari.
              </p>
              <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/80">
                Semua dokumen bermasa berlaku masih aman saat ini.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((document) => {
            const urgent = document.daysRemaining < 14;

            return (
              <Link
                key={document.id}
                href={routeTo.documentDetail(document.id)}
                className={cn(
                  "block rounded-xl border p-3 transition-colors hover:bg-muted/50",
                  urgent
                    ? "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                    : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                )}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{document.documentName}</p>
                    <p className="mt-1 text-xs opacity-85">
                      Kedaluwarsa {formatDate(document.expiryDate)} · sisa {document.daysRemaining} hari
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </CardContainer>
  );
}

export function EmployeeDashboardView({ stats }: EmployeeDashboardViewProps) {
  const metricCards = [
    {
      title: "Total Dokumen",
      compactTitle: "Total",
      value: stats.totalSubmitted,
      description: "Seluruh berkas yang pernah diunggah",
      icon: FileText,
      iconClassName: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Menunggu Verifikasi",
      compactTitle: "Menunggu",
      value: stats.pendingCount,
      description: "Sedang antre diperiksa Staf HRD",
      icon: Clock3,
      iconClassName: "bg-amber-500/10 text-amber-500",
      valueClassName: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Disetujui",
      compactTitle: "Aktif",
      value: stats.approvedCount,
      description: "Berkas sah dan aktif",
      icon: ShieldCheck,
      iconClassName: "bg-emerald-500/10 text-emerald-500",
      valueClassName: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Ditolak",
      compactTitle: "Ditolak",
      value: stats.rejectedCount,
      description: "Perlu diperbaiki dan diunggah ulang",
      icon: FileWarning,
      iconClassName: "bg-rose-500/10 text-rose-500",
      valueClassName: "text-rose-600 dark:text-rose-400",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ikhtisar"
        title="Dashboard"
        description="Ringkasan pribadi kondisi dokumen kepegawaian Anda."
      />

      <div className="grid gap-1.5 sm:gap-4 grid-cols-4">
        {metricCards.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <DocumentCompletenessProgress
        completed={stats.mandatoryDocumentCompleted}
        total={stats.mandatoryDocumentTotal}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <CardContainer
          title="Dokumen terbaru"
          description="5 berkas terakhir yang Anda kirim beserta status verifikasinya."
          contentClassName="p-0"
        >
          {stats.recentUploads.length === 0 ? (
            <EmptyRecentDocuments />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Nama dokumen</TableHead>
                  <TableHead>Tanggal pengiriman</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentUploads.map((document) => (
                  <TableRow key={document.id} className="cursor-pointer">
                    <TableCell className="pl-4">
                      <Link
                        href={routeTo.documentDetail(document.id)}
                        className="block font-medium text-foreground hover:text-primary"
                      >
                        {document.documentName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <Link href={routeTo.documentDetail(document.id)} className="block">
                        {formatDate(document.uploadedAt)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={routeTo.documentDetail(document.id)} className="block">
                        <DocumentStatusBadge status={document.status} />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContainer>

        <ExpiryWarningCard documents={stats.expiringDocuments} />
      </div>
    </div>
  );
}
