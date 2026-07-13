"use client";

import { useState, useCallback, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Search,
  Clock3,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
  getVerificationQueue as getQueueAction,
  verifyDocumentAction,
} from "@/modules/verification/actions";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type QueueItem = {
  id: string;
  owner: {
    id: string;
    name: string;
    employeeId: string | null;
    nik: string | null;
    workplace: string | null;
  };
  documentType: {
    id: string;
    name: string;
  };
  title: string | null;
  documentNumber: string | null;
  uploadedAt: string;
};

type PaginationInfo = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type DocumentTypeOption = {
  id: string;
  code: string;
  name: string;
};

type VerificationQueueViewProps = {
  initialData: QueueItem[];
  /** The nested pagination object from the server action meta */
  initialPagination: PaginationInfo;
  documentTypes: DocumentTypeOption[];
};

/* -------------------------------------------------------------------------- */
/*  Helper                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function getErrorMessage(error: unknown, fallback = "Terjadi kesalahan.") {
  return error instanceof Error ? error.message : fallback;
}

function formatEmployeeIdentifier(
  employeeId: string | null,
  nik: string | null
) {
  if (employeeId) return `NIP. ${employeeId}`;
  if (nik) return `NIK. ${nik}`;
  return "ID belum diset";
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function VerificationQueueView({
  initialData,
  initialPagination,
  documentTypes,
}: VerificationQueueViewProps) {
  const [isPending, startTransition] = useTransition();

  /* data */
  const [items, setItems] = useState<QueueItem[]>(initialData);
  const [pagination, setPagination] = useState<PaginationInfo>(
    initialPagination
  );

  /* filter state */
  const [search, setSearch] = useState("");
  const [documentTypeId, setDocumentTypeId] = useState("");
  const [page, setPage] = useState(initialPagination.page);

  /* reject dialog */
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    docId: string;
    docTitle: string;
    ownerName: string;
  }>({ open: false, docId: "", docTitle: "", ownerName: "" });
  const [rejectNote, setRejectNote] = useState("");
  const [rejectError, setRejectError] = useState("");

  /* approve confirm */
  const [approveConfirm, setApproveConfirm] = useState<{
    open: boolean;
    docId: string;
    docTitle: string;
    ownerName: string;
  }>({ open: false, docId: "", docTitle: "", ownerName: "" });

  /* error */
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /* Track initial render to skip fetch on mount */
  const isFirstRender = useRef(true);

  /* ------------------------------------------------------------------------ */
  /*  Fetch data                                                              */
  /* ------------------------------------------------------------------------ */

  const fetchQueue = useCallback(
    async (
      overrides?: {
        page?: number;
        search?: string;
        documentTypeId?: string;
      }
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getQueueAction({
          page: overrides?.page ?? page,
          search: (overrides?.search ?? search) || undefined,
          documentTypeId:
            (overrides?.documentTypeId ?? documentTypeId) || undefined,
          pageSize: 15,
        });
        if (!result.ok) {
          setError(
            result.error?.message || "Gagal memuat antrian verifikasi."
          );
          return;
        }
        setItems(result.data);
        setPagination(result.meta.pagination);
      } catch (error: unknown) {
        setError(getErrorMessage(error, "Terjadi kesalahan saat memuat data."));
      } finally {
        setIsLoading(false);
      }
    },
    [page, search, documentTypeId]
  );

  /* Auto-fetch when filters change (skip first render) */
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    startTransition(() => {
      fetchQueue();
    });
  }, [page, search, documentTypeId, fetchQueue]);

  /* ------------------------------------------------------------------------ */
  /*  Actions                                                                 */
  /* ------------------------------------------------------------------------ */

  const handleApprove = useCallback(async () => {
    const { docId, docTitle, ownerName } = approveConfirm;
    setApproveConfirm((prev) => ({ ...prev, open: false }));

    const toastId = toast.loading(`Menyetujui dokumen "${docTitle}"...`);

    try {
      const result = await verifyDocumentAction(docId, "APPROVED", null);
      if (!result.ok) {
        toast.error(
          result.error?.message || "Gagal menyetujui dokumen.",
          { id: toastId }
        );
        return;
      }
      toast.success(
        `Dokumen "${docTitle}" milik ${ownerName} berhasil disetujui.`,
        { id: toastId }
      );
      startTransition(() => fetchQueue());
    } catch (error: unknown) {
      toast.error(getErrorMessage(error), { id: toastId });
    }
  }, [approveConfirm, fetchQueue]);

  const openRejectDialog = useCallback(
    (docId: string, docTitle: string, ownerName: string) => {
      setRejectNote("");
      setRejectError("");
      setRejectDialog({ open: true, docId, docTitle, ownerName });
    },
    []
  );

  const handleRejectSubmit = useCallback(async () => {
    const trimmed = rejectNote.trim();
    if (trimmed.length < 5) {
      setRejectError("Catatan penolakan wajib diisi minimal 5 karakter.");
      return;
    }
    setRejectError("");

    const { docId, docTitle, ownerName } = rejectDialog;
    setRejectDialog((prev) => ({ ...prev, open: false }));

    const toastId = toast.loading(`Menolak dokumen "${docTitle}"...`);

    try {
      const result = await verifyDocumentAction(
        docId,
        "REJECTED",
        trimmed
      );
      if (!result.ok) {
        toast.error(
          result.error?.message || "Gagal menolak dokumen.",
          { id: toastId }
        );
        return;
      }
      toast.success(
        `Dokumen "${docTitle}" milik ${ownerName} berhasil ditolak.`,
        { id: toastId }
      );
      startTransition(() => fetchQueue());
    } catch (error: unknown) {
      toast.error(getErrorMessage(error), { id: toastId });
    }
  }, [rejectNote, rejectDialog, fetchQueue]);

  /* ------------------------------------------------------------------------ */
  /*  Filter handlers                                                         */
  /* ------------------------------------------------------------------------ */

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setPage(1);
    },
    []
  );

  const handleDocumentTypeChange = useCallback(
    (value: string | null) => {
      setDocumentTypeId(value ?? "");
      setPage(1);
    },
    []
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  /* ------------------------------------------------------------------------ */
  /*  Derived stats                                                           */
  /* ------------------------------------------------------------------------ */

  const todayCount = items.filter((item) => {
    const d = new Date(item.uploadedAt);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }).length;

  /* ------------------------------------------------------------------------ */
  /*  Render                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="space-y-6">
      {/* Page header */}
      <PageHeader
        title="Verifikasi Dokumen"
        description="Periksa dan verifikasi dokumen pegawai yang menunggu persetujuan."
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Menunggu Verifikasi"
          value={pagination.totalItems}
          description="Total dokumen dalam antrian"
          icon={Clock3}
          iconClassName="bg-amber-500/10 text-amber-500"
          valueClassName="text-amber-600 dark:text-amber-400"
        />
        <MetricCard
          title="Hari Ini"
          value={todayCount}
          description="Dokumen masuk hari ini"
          icon={ClipboardCheck}
          iconClassName="bg-blue-500/10 text-blue-500"
        />
        <MetricCard
          title="Total Halaman"
          value={pagination.totalPages}
          description={`Halaman ${pagination.page} dari ${pagination.totalPages}`}
          icon={FileText}
          iconClassName="bg-purple-500/10 text-purple-500"
        />
      </div>

      {/* Search & Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter Pencarian</CardTitle>
          <CardDescription>
            Cari berdasarkan nama pegawai atau filter berdasarkan jenis dokumen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama pegawai..."
                value={search}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>
            <Select
              value={documentTypeId || undefined}
              onValueChange={handleDocumentTypeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua jenis dokumen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua jenis dokumen</SelectItem>
                {documentTypes.map((dt) => (
                  <SelectItem key={dt.id} value={dt.id}>
                    {dt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Gagal Memuat Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Content */}
      {isLoading ? (
        /* Loading skeleton */
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        /* Empty state */
        <Card>
          <CardContent className="flex min-h-[240px] items-center justify-center text-center">
            <div className="space-y-3">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
                <ClipboardCheck className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {search || documentTypeId
                  ? "Tidak ada dokumen yang cocok dengan filter."
                  : "Tidak ada dokumen yang menunggu verifikasi."}
              </p>
              <p className="text-xs text-muted-foreground">
                {search || documentTypeId
                  ? "Coba ubah kata kunci atau filter."
                  : "Semua dokumen pegawai sudah diverifikasi."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Pegawai</TableHead>
                  <TableHead>Jenis Dokumen</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Judul / No. Dokumen
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Diunggah
                  </TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>{item.owner.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatEmployeeIdentifier(
                            item.owner.employeeId,
                            item.owner.nik
                          )}
                        </div>
                        {item.owner.workplace && (
                          <div className="text-xs text-muted-foreground">
                            {item.owner.workplace}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {item.documentType.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="space-y-0.5">
                        <div className="text-sm">
                          {item.title || item.documentType.name}
                        </div>
                        {item.documentNumber && (
                          <div className="text-xs text-muted-foreground">
                            No: {item.documentNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground sm:table-cell">
                      {formatDate(item.uploadedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/verification/${item.id}`}
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                          })}
                        >
                          <ExternalLink className="mr-1 size-3.5" />
                          Detail
                        </Link>
                        <div className="flex gap-1">
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() =>
                              setApproveConfirm({
                                open: true,
                                docId: item.id,
                                docTitle:
                                  item.title || item.documentType.name,
                                ownerName: item.owner.name,
                              })
                            }
                          >
                            <CheckCircle2 className="mr-1 size-3.5" />
                            Setuju
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              openRejectDialog(
                                item.id,
                                item.title || item.documentType.name,
                                item.owner.name
                              )
                            }
                          >
                            <XCircle className="mr-1 size-3.5" />
                            Tolak
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card layout */}
          <div className="space-y-3 md:hidden">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header: employee + doc type */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          {item.owner.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatEmployeeIdentifier(
                            item.owner.employeeId,
                            item.owner.nik
                          )}
                        </div>
                        {item.owner.workplace && (
                          <div className="text-xs text-muted-foreground">
                            {item.owner.workplace}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className="shrink-0 font-normal"
                      >
                        {item.documentType.name}
                      </Badge>
                    </div>

                    {/* Document info */}
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {item.title || item.documentType.name}
                        {item.documentNumber &&
                          ` · ${item.documentNumber}`}
                      </span>
                      <span>{formatDate(item.uploadedAt)}</span>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={`/verification/${item.id}`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        <ExternalLink className="mr-1 size-3.5" />
                        Detail
                      </Link>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() =>
                          setApproveConfirm({
                            open: true,
                            docId: item.id,
                            docTitle:
                              item.title || item.documentType.name,
                            ownerName: item.owner.name,
                          })
                        }
                      >
                        <CheckCircle2 className="mr-1 size-3.5" />
                        Setuju
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          openRejectDialog(
                            item.id,
                            item.title || item.documentType.name,
                            item.owner.name
                          )
                        }
                      >
                        <XCircle className="mr-1 size-3.5" />
                        Tolak
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Menampilkan halaman{" "}
                <span className="font-medium">{pagination.page}</span> dari{" "}
                <span className="font-medium">{pagination.totalPages}</span>{" "}
                ({pagination.totalItems} dokumen)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPreviousPage || isLoading}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  <ChevronLeft className="size-4" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage || isLoading}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Berikutnya
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Approve Confirmation Dialog ── */}
      <AlertDialog
        open={approveConfirm.open}
        onOpenChange={(open) =>
          setApproveConfirm((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Setujui Dokumen</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menyetujui dokumen{" "}
              <span className="font-medium text-foreground">
                &ldquo;{approveConfirm.docTitle}&rdquo;
              </span>{" "}
              milik{" "}
              <span className="font-medium text-foreground">
                {approveConfirm.ownerName}
              </span>
              . Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Ya, Setujui
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Reject Dialog ── */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) =>
          setRejectDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tolak Dokumen</DialogTitle>
            <DialogDescription>
              Anda akan menolak dokumen{" "}
              <span className="font-medium text-foreground">
                &ldquo;{rejectDialog.docTitle}&rdquo;
              </span>{" "}
              milik{" "}
              <span className="font-medium text-foreground">
                {rejectDialog.ownerName}
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
              onClick={() =>
                setRejectDialog((prev) => ({ ...prev, open: false }))
              }
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
            >
              Ya, Tolak Dokumen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
