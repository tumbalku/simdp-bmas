"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock3,
  FileText,
  Hash,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { InfoCard } from "@/components/shared/InfoCard";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  DocumentPreviewPanel,
  DocumentReviewLayout,
  DocumentStatusCard,
  DocumentVerificationHistory,
  type ReviewInfoField,
  type ReviewStatusConfig,
} from "@/components/shared/document-review";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DATE_FORMATS, DATE_LOCALE } from "@/constants";
import {
  getVerificationDocumentPreviewUrlAction,
  verifyDocumentAction,
} from "@/modules/verification";
import { VERIFICATION_STATUS_LABELS } from "@/modules/verification";

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
  ownerNik: string | null;
  ownerWorkplace: string | null;
  verificationHistories: Array<{
    id: string;
    status: string;
    reviewNote: string | null;
    reviewedAt: string | null;
    reviewerName: string;
  }>;
};

type VerificationDetailViewProps = {
  document: DocumentDetail;
};

const statusConfig: Record<string, ReviewStatusConfig> = {
  PENDING: {
    label: VERIFICATION_STATUS_LABELS.PENDING,
    color: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800",
    icon: Clock3,
  },
  APPROVED: {
    label: VERIFICATION_STATUS_LABELS.APPROVED,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-800",
    icon: ShieldCheck,
  },
  REJECTED: {
    label: VERIFICATION_STATUS_LABELS.REJECTED,
    color: "text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950 dark:border-rose-800",
    icon: AlertTriangle,
  },
  EXPIRED: {
    label: VERIFICATION_STATUS_LABELS.EXPIRED,
    color: "text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-900 dark:border-slate-800",
    icon: AlertTriangle,
  },
  REPLACED: {
    label: VERIFICATION_STATUS_LABELS.REPLACED,
    color: "text-slate-500 bg-slate-50 border-slate-200 dark:text-slate-500 dark:bg-slate-900 dark:border-slate-800",
    icon: FileText,
  },
} as const;

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMATS.dateTime).format(new Date(value));
}

function formatFileSize(value: number | null) {
  if (!value) return "-";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan.";
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
    {
      key: "ownerNik",
      icon: Hash,
      label: "NIK",
      value: document.ownerNik,
      hidden: !document.ownerNik,
    },
    {
      key: "ownerWorkplace",
      icon: Building2,
      label: "Unit Kerja",
      value: document.ownerWorkplace,
      hidden: !document.ownerWorkplace,
    },
  ];
}

function getDocumentFields(document: DocumentDetail): ReviewInfoField[] {
  return [
    { key: "documentTypeName", icon: FileText, label: "Jenis Dokumen", value: document.documentTypeName },
    { key: "archiveCategory", icon: Hash, label: "Kategori Arsip", value: document.archiveCategory },
    { key: "fileName", icon: FileText, label: "Nama File", value: document.fileName },
    { key: "fileSize", icon: FileText, label: "Ukuran", value: formatFileSize(document.fileSize) },
    {
      key: "documentNumber",
      icon: Hash,
      label: "Nomor Dokumen",
      value: document.documentNumber,
      hidden: !document.documentNumber,
    },
    {
      key: "mimeType",
      icon: FileText,
      label: "Jenis File",
      value: document.mimeType,
      hidden: !document.mimeType,
    },
    { key: "uploadedAt", icon: Calendar, label: "Tanggal Unggah", value: formatDate(document.uploadedAt) },
    { key: "issueDate", icon: Calendar, label: "Tanggal Terbit", value: formatDate(document.issueDate) },
    {
      key: "expiryDate",
      icon: Calendar,
      label: "Tanggal Kedaluwarsa",
      value: formatDate(document.expiryDate),
    },
  ];
}

export function VerificationDetailView({ document }: VerificationDetailViewProps) {
  const router = useRouter();
  const status = statusConfig[document.status] || statusConfig.PENDING;
  const isPending = document.status === "PENDING";

  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPreviewUrl() {
      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const payload = await getVerificationDocumentPreviewUrlAction(document.id);
        if (!payload.ok || !payload.data?.url) {
          throw new Error(payload.error?.message || "Gagal menyiapkan pratinjau berkas.");
        }
        if (!cancelled) setPreviewUrl(payload.data.url);
      } catch (error: unknown) {
        if (!cancelled) setPreviewError(getErrorMessage(error));
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }

    void loadPreviewUrl();

    return () => {
      cancelled = true;
    };
  }, [document.id]);

  const handleApprove = useCallback(async () => {
    setApproving(true);
    const toastId = toast.loading("Menyetujui dokumen...");
    try {
      const result = await verifyDocumentAction(document.id, "APPROVED", null);
      if (!result.ok) {
        toast.error(result.error?.message || "Gagal menyetujui dokumen.", { id: toastId });
        return;
      }
      toast.success("Dokumen berhasil disetujui.", { id: toastId });
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error), { id: toastId });
    } finally {
      setApproving(false);
      setShowApproveConfirm(false);
    }
  }, [document.id, router]);

  const handleReject = useCallback(async () => {
    const trimmed = rejectNote.trim();
    if (trimmed.length < 5) {
      setRejectError("Catatan penolakan wajib diisi minimal 5 karakter.");
      return;
    }

    setRejectError("");
    setRejecting(true);
    const toastId = toast.loading("Menolak dokumen...");
    try {
      const result = await verifyDocumentAction(document.id, "REJECTED", trimmed);
      if (!result.ok) {
        toast.error(result.error?.message || "Gagal menolak dokumen.", { id: toastId });
        return;
      }
      toast.success("Dokumen berhasil ditolak.", { id: toastId });
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error), { id: toastId });
    } finally {
      setRejecting(false);
      setShowRejectDialog(false);
    }
  }, [document.id, rejectNote, router]);

  const statusActions = isPending ? (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      <Button
        variant="default"
        size="sm"
        className="bg-emerald-600 hover:bg-emerald-700"
        onClick={() => setShowApproveConfirm(true)}
        disabled={approving}
      >
        <CheckCircle2 className="mr-1.5 size-3.5" />
        Setujui
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => {
          setRejectNote("");
          setRejectError("");
          setShowRejectDialog(true);
        }}
        disabled={rejecting}
      >
        <XCircle className="mr-1.5 size-3.5" />
        Tolak
      </Button>
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      <PageHeader
        backHref="/verification"
        backLabel="Kembali ke antrian"
        title={document.title || document.documentTypeName}
        description={`${document.documentTypeName} milik ${document.ownerName}`}
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
            <DocumentStatusCard
              label="Status Pemeriksaan"
              status={status}
              actions={statusActions}
            />
            <InfoCard
              title="Pemilik Dokumen"
              description="Informasi pegawai pengirim berkas."
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
            emptyDescription={isPending ? "Dokumen ini menunggu verifikasi dari staf kepegawaian." : undefined}
          />
        }
      />

      <AlertDialog open={showApproveConfirm} onOpenChange={setShowApproveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Setujui Dokumen</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menyetujui dokumen{" "}
              <span className="font-medium text-foreground">
                &ldquo;{document.title || document.documentTypeName}&rdquo;
              </span>{" "}
              milik <span className="font-medium text-foreground">{document.ownerName}</span>.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={approving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {approving ? "Memproses..." : "Ya, Setujui"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tolak Dokumen</DialogTitle>
            <DialogDescription>
              Anda akan menolak dokumen{" "}
              <span className="font-medium text-foreground">
                &ldquo;{document.title || document.documentTypeName}&rdquo;
              </span>{" "}
              milik <span className="font-medium text-foreground">{document.ownerName}</span>.
              Berikan alasan penolakan sebagai catatan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Tuliskan alasan penolakan (minimal 5 karakter)..."
              value={rejectNote}
              onChange={(e) => {
                setRejectNote(e.target.value);
                if (e.target.value.trim().length >= 5) setRejectError("");
              }}
              rows={4}
              className={rejectError ? "border-destructive" : ""}
            />
            {rejectError && <p className="text-xs text-destructive">{rejectError}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectError("");
              }}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejecting}>
              {rejecting ? "Memproses..." : "Ya, Tolak Dokumen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
