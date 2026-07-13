"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock3,
  ShieldCheck,
  AlertTriangle,
  User,
  Building2,
  Calendar,
  Hash,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { verifyDocumentAction } from "@/modules/verification/actions";
import { VERIFICATION_STATUS_LABELS } from "@/modules/verification/constants";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock3 }> = {
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

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function VerificationDetailView({
  document,
}: VerificationDetailViewProps) {
  const router = useRouter();
  const status = statusConfig[document.status] || statusConfig.PENDING;
  const StatusIcon = status.icon;
  const isPending = document.status === "PENDING";

  /* Approve */
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [approving, setApproving] = useState(false);

  /* Reject */
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const handleApprove = useCallback(async () => {
    setApproving(true);
    const toastId = toast.loading("Menyetujui dokumen...");
    try {
      const result = await verifyDocumentAction(
        document.id,
        "APPROVED",
        null
      );
      if (!result.ok) {
        toast.error(result.error?.message || "Gagal menyetujui dokumen.", {
          id: toastId,
        });
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
      const result = await verifyDocumentAction(
        document.id,
        "REJECTED",
        trimmed
      );
      if (!result.ok) {
        toast.error(result.error?.message || "Gagal menolak dokumen.", {
          id: toastId,
        });
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

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/verification"
        backLabel="Kembali ke antrian"
        eyebrow="Verifikasi dokumen"
        title={document.title || document.documentTypeName}
        description={`${document.documentTypeName} milik ${document.ownerName}`}
        trailing={
          <Link
            href={`/documents/${document.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="size-4" />
            Lihat di dokumen
          </Link>
        }
      />

      {/* Status banner + quick actions */}
      <Card
        className={`border-l-4 ${isPending ? "border-l-amber-500" : document.status === "APPROVED" ? "border-l-emerald-500" : document.status === "REJECTED" ? "border-l-rose-500" : "border-l-slate-400"}`}
      >
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-10 items-center justify-center rounded-full ${status.color.split(" ").slice(0, 2).join(" ")}`}
            >
              <StatusIcon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <Badge
                variant="outline"
                className={`mt-0.5 ${status.color}`}
              >
                {status.label}
              </Badge>
            </div>
          </div>

          {isPending && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowApproveConfirm(true)}
                disabled={approving}
              >
                <CheckCircle2 className="mr-1.5 size-4" />
                Setujui Dokumen
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setRejectNote("");
                  setRejectError("");
                  setShowRejectDialog(true);
                }}
                disabled={rejecting}
              >
                <XCircle className="mr-1.5 size-4" />
                Tolak Dokumen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        {/* Document Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Informasi Dokumen
            </CardTitle>
            <CardDescription>
              Detail metadata dan informasi file dokumen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem
                icon={FileText}
                label="Jenis Dokumen"
                value={document.documentTypeName}
              />
              <InfoItem
                icon={Hash}
                label="Kategori Arsip"
                value={document.archiveCategory}
              />
              <InfoItem
                icon={FileText}
                label="Nama File"
                value={document.fileName}
              />
              <InfoItem
                icon={FileText}
                label="Ukuran"
                value={formatFileSize(document.fileSize)}
              />
              {document.documentNumber && (
                <InfoItem
                  icon={Hash}
                  label="Nomor Dokumen"
                  value={document.documentNumber}
                />
              )}
              {document.mimeType && (
                <InfoItem
                  icon={FileText}
                  label="Jenis File"
                  value={document.mimeType}
                />
              )}
              <InfoItem
                icon={Calendar}
                label="Tanggal Unggah"
                value={formatDate(document.uploadedAt)}
              />
              <InfoItem
                icon={Calendar}
                label="Tanggal Terbit"
                value={formatDate(document.issueDate)}
              />
              <InfoItem
                icon={Calendar}
                label="Tanggal Kedaluwarsa"
                value={formatDate(document.expiryDate)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Owner Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              Pemilik Dokumen
            </CardTitle>
            <CardDescription>
              Informasi pegawai pemilik dokumen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={User} label="Nama" value={document.ownerName} />
            {document.ownerEmployeeId && (
              <InfoItem
                icon={Hash}
                label="NIP"
                value={document.ownerEmployeeId}
              />
            )}
            {document.ownerNik && (
              <InfoItem icon={Hash} label="NIK" value={document.ownerNik} />
            )}
            {document.ownerWorkplace && (
              <InfoItem
                icon={Building2}
                label="Unit Kerja"
                value={document.ownerWorkplace}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verification History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            Riwayat Verifikasi
          </CardTitle>
          <CardDescription>
            Semua aktivitas verifikasi yang pernah dilakukan pada dokumen ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {document.verificationHistories.length === 0 ? (
            <div className="flex min-h-[120px] items-center justify-center text-center">
              <div className="space-y-2">
                <Clock3 className="mx-auto size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Belum ada riwayat verifikasi.
                </p>
                {isPending && (
                  <p className="text-xs text-muted-foreground">
                    Dokumen ini menunggu verifikasi dari staf kepegawaian.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {document.verificationHistories.map((history, index) => {
                const hStatus =
                  statusConfig[history.status] || statusConfig.PENDING;
                const HIcon = hStatus.icon;
                return (
                  <div
                    key={history.id}
                    className="relative rounded-lg border bg-card p-4"
                  >
                    {index > 0 && (
                      <div className="absolute -top-3 left-7 h-3 w-px border-l border-dashed" />
                    )}
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${hStatus.color.split(" ").slice(0, 2).join(" ")}`}
                      >
                        <HIcon className="size-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Badge
                            variant="outline"
                            className={hStatus.color}
                          >
                            {hStatus.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(history.reviewedAt)}
                          </span>
                        </div>
                        <p className="text-sm">
                          {history.reviewNote || "Tidak ada catatan."}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Reviewer: {history.reviewerName}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Approve Confirmation ── */}
      <AlertDialog
        open={showApproveConfirm}
        onOpenChange={setShowApproveConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Setujui Dokumen</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menyetujui dokumen{" "}
              <span className="font-medium text-foreground">
                &ldquo;{document.title || document.documentTypeName}&rdquo;
              </span>{" "}
              milik{" "}
              <span className="font-medium text-foreground">
                {document.ownerName}
              </span>
              . Tindakan ini tidak dapat dibatalkan.
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

      {/* ── Reject Dialog ── */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tolak Dokumen</DialogTitle>
            <DialogDescription>
              Anda akan menolak dokumen{" "}
              <span className="font-medium text-foreground">
                &ldquo;{document.title || document.documentTypeName}&rdquo;
              </span>{" "}
              milik{" "}
              <span className="font-medium text-foreground">
                {document.ownerName}
              </span>
              . Berikan alasan penolakan sebagai catatan.
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
            {rejectError && (
              <p className="text-xs text-destructive">{rejectError}</p>
            )}
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
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejecting}
            >
              {rejecting ? "Memproses..." : "Ya, Tolak Dokumen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Info Item Sub-component                                                   */
/* -------------------------------------------------------------------------- */

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-1 text-sm font-medium">{value || "-"}</div>
    </div>
  );
}
