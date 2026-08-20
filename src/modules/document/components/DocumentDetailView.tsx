"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Calendar, CheckCircle2, Clock3, FileText, Hash, User, XCircle } from "lucide-react";

import { InfoCard } from "@/components/cards/InfoCard";
import { PageHeader } from "@/components/navigation/PageHeader";
import {
  DocumentPreviewPanel,
  DocumentReviewLayout,
  DocumentStatusCard,
  DocumentVerificationHistory,
  type ReviewInfoField,
  type ReviewStatusConfig,
} from "@/modules/document/components/document-review";
import { fetchDocumentPreviewUrl } from "@/modules/document/api";
import { DownloadDocumentButton } from "@/modules/document/components/DownloadDocumentButton";
import { getExpiryStatusInfo } from "@/modules/document";

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
  verificationHistories: Array<{
    id: string;
    status: string;
    reviewNote: string | null;
    reviewedAt: string | null;
    reviewerName: string;
  }>;
};

type DocumentDetailViewProps = {
  document: DocumentDetail;
  backHref?: string;
  backLabel?: string;
};

const statusConfig: Record<string, ReviewStatusConfig> = {
  PENDING: {
    label: "Menunggu",
    icon: Clock3,
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  APPROVED: {
    label: "Disetujui",
    icon: CheckCircle2,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  REJECTED: {
    label: "Ditolak",
    icon: XCircle,
    color: "bg-rose-100 text-rose-700 border-rose-200",
  },
  EXPIRED: {
    label: "Kedaluwarsa",
    icon: Clock3,
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
  REPLACED: {
    label: "Diganti",
    icon: FileText,
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileSize(value: number | null) {
  if (!value) return "-";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function getOwnerFields(document: DocumentDetail): ReviewInfoField[] {
  return [
    { key: "ownerName", icon: User, label: "Nama", value: document.ownerName },
    {
      key: "ownerEmployeeId",
      icon: Hash,
      label: "NIP",
      value: document.ownerEmployeeId,
      hidden: !document.ownerEmployeeId,
    },
  ];
}

function getDocumentFields(document: DocumentDetail): ReviewInfoField[] {
  const expiry = getExpiryStatusInfo(document.expiryDate);
  let expiryValue: React.ReactNode = formatDate(document.expiryDate);

  if (expiry?.type === "EXPIRED") {
    expiryValue = (
      <span className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
        <AlertTriangle className="size-3.5 shrink-0" />
        {expiry.label}
      </span>
    );
  } else if (expiry?.type === "EXPIRING_SOON") {
    expiryValue = (
      <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
        <Clock3 className="size-3.5 shrink-0" />
        {expiry.label}
      </span>
    );
  }

  return [
    { key: "documentTypeName", icon: FileText, label: "Jenis Dokumen", value: document.documentTypeName },
    { key: "archiveCategory", icon: Hash, label: "Kategori Arsip", value: document.archiveCategory },
    { key: "fileName", icon: FileText, label: "Nama File", value: document.fileName },
    { key: "fileSize", icon: FileText, label: "Ukuran", value: formatFileSize(document.fileSize) },
    { key: "documentNumber", icon: Hash, label: "Nomor Dokumen", value: document.documentNumber || "-" },
    { key: "mimeType", icon: FileText, label: "Jenis File", value: document.mimeType || "-" },
    { key: "uploadedAt", icon: Calendar, label: "Tanggal Unggah", value: formatDate(document.uploadedAt) },
    { key: "issueDate", icon: Calendar, label: "Tanggal Terbit", value: formatDate(document.issueDate) },
    {
      key: "expiryDate",
      icon: Calendar,
      label: "Tanggal Kedaluwarsa",
      value: expiryValue,
    },
  ];
}

export function DocumentDetailView({
  document,
  backHref = "/documents",
  backLabel = "Kembali ke dokumen",
}: DocumentDetailViewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const status = statusConfig[document.status] ?? {
    label: document.status,
    icon: FileText,
    color: "bg-slate-100 text-slate-700 border-slate-200",
  };

  useEffect(() => {
    let cancelled = false;

    async function loadPreviewUrl() {
      setPreviewLoading(true);
      setPreviewError(null);

      try {
        const url = await fetchDocumentPreviewUrl(document.id);
        if (!cancelled) {
          setPreviewUrl(url);
        }
      } catch (error) {
        if (!cancelled) {
          setPreviewError(error instanceof Error ? error.message : "Gagal menyiapkan pratinjau berkas.");
        }
      }

      if (!cancelled) {
        setPreviewLoading(false);
      }
    }

    void loadPreviewUrl();

    return () => {
      cancelled = true;
    };
  }, [document.id]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Dokumen"
        backHref={backHref}
        backLabel={backLabel}
        title={document.title || document.documentTypeName}
        description={`${document.documentTypeName} milik ${document.ownerName}`}
        trailing={<DownloadDocumentButton documentId={document.id} />}
      />

      <DocumentReviewLayout
        preview={
          <DocumentPreviewPanel
            fileName={document.fileName}
            mimeType={document.mimeType}
            previewError={previewError}
            previewLoading={previewLoading}
            previewUrl={previewUrl}
            title={document.title || document.documentTypeName}
          />
        }
        sidebar={
          <>
            <DocumentStatusCard label="Status Dokumen" status={status} />
            <InfoCard
              title="Pemilik Dokumen"
              description="Informasi pegawai pemilik berkas."
              icon={User}
              fields={getOwnerFields(document)}
            />
            <InfoCard
              title="Informasi Dokumen"
              description="Detail metadata dan informasi file dokumen."
              icon={FileText}
              fields={getDocumentFields(document)}
              columns={2}
            />
          </>
        }
        history={
          <DocumentVerificationHistory
            histories={document.verificationHistories}
            statusConfig={statusConfig}
            formatDate={formatDate}
          />
        }
      />
    </div>
  );
}
