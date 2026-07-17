"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  ShieldCheck,
  Clock3,
  AlertTriangle,
  FileWarning,
  GraduationCap,
  Briefcase,
  Award,
  Scale,
  User,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DATE_FORMATS, DATE_LOCALE, routeTo } from "@/constants";
import { softDeleteDocumentAction } from "@/modules/document/actions";
import { DocumentUploadForm } from "@/modules/document/components/DocumentUploadForm";
import { DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_VARIANTS } from "@/modules/document/constants";
import type { DocumentRecordListItem, DocumentTypeOption } from "@/modules/document/types";

type DocumentsPageViewProps = {
  documents: DocumentRecordListItem[];
  documentTypes: DocumentTypeOption[];
  canUpload: boolean;
};

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock3 }
> = {
  PENDING: { label: DOCUMENT_STATUS_LABELS.PENDING, variant: DOCUMENT_STATUS_VARIANTS.PENDING, icon: Clock3 },
  APPROVED: { label: DOCUMENT_STATUS_LABELS.APPROVED, variant: DOCUMENT_STATUS_VARIANTS.APPROVED, icon: ShieldCheck },
  REJECTED: { label: DOCUMENT_STATUS_LABELS.REJECTED, variant: DOCUMENT_STATUS_VARIANTS.REJECTED, icon: AlertTriangle },
  EXPIRED: { label: DOCUMENT_STATUS_LABELS.EXPIRED, variant: DOCUMENT_STATUS_VARIANTS.EXPIRED, icon: AlertTriangle },
  REPLACED: { label: DOCUMENT_STATUS_LABELS.REPLACED, variant: DOCUMENT_STATUS_VARIANTS.REPLACED, icon: FileText },
} as const;

const archiveCategoryIcons: Record<string, typeof FileText> = {
  PERSONAL: User,
  EDUCATION: GraduationCap,
  EMPLOYMENT: Briefcase,
  CERTIFICATION: Award,
  LEGAL: Scale,
} as const;

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMATS.date).format(new Date(value));
}

function formatFileSize(value: number | null) {
  if (!value) return "-";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

type GroupedDocuments = {
  documentTypeId: string;
  documentTypeName: string;
  archiveCategory: string;
  allowMultiple: boolean;
  documentType?: DocumentTypeOption;
  documents: DocumentRecordListItem[];
};

function groupDocumentsByAvailableTypes(
  documents: DocumentRecordListItem[],
  documentTypes: DocumentTypeOption[],
): GroupedDocuments[] {
  const documentsByType = new Map<string, DocumentRecordListItem[]>();

  for (const document of documents) {
    const current = documentsByType.get(document.documentTypeId) ?? [];
    current.push(document);
    documentsByType.set(document.documentTypeId, current);
  }

  const groups: GroupedDocuments[] = documentTypes.map((type) => ({
    documentTypeId: type.id,
    documentTypeName: type.name,
    archiveCategory: type.archiveCategory,
    allowMultiple: type.allowMultiple,
    documentType: type,
    documents: documentsByType.get(type.id) ?? [],
  }));

  const knownTypeIds = new Set(documentTypes.map((type) => type.id));
  for (const document of documents) {
    if (knownTypeIds.has(document.documentTypeId)) continue;

    groups.push({
      documentTypeId: document.documentTypeId,
      documentTypeName: document.documentTypeName,
      archiveCategory: document.archiveCategory,
      allowMultiple: true,
      documents: documentsByType.get(document.documentTypeId) ?? [],
    });
    knownTypeIds.add(document.documentTypeId);
  }

  return groups.sort((a, b) => a.documentTypeName.localeCompare(b.documentTypeName));
}

function DocumentTypeUploadAction({
  group,
  documentTypes,
}: {
  group: GroupedDocuments;
  documentTypes: DocumentTypeOption[];
}) {
  const [open, setOpen] = useState(false);
  if (!group.documentType) return null;

  const isDisabled = !group.allowMultiple && group.documents.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        size="xs"
        variant="default"
        className="ml-auto shrink-0 whitespace-nowrap"
        disabled={isDisabled}
        onClick={(event) => {
          event.stopPropagation();
          if (isDisabled) return;
          setOpen(true);
        }}
      >
        <Plus className="size-3.5" />
        Tambah
      </Button>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah dokumen</DialogTitle>
          <DialogDescription>
            {`Unggah dokumen baru untuk jenis ${group.documentTypeName}.`}
          </DialogDescription>
        </DialogHeader>
        <DocumentUploadForm
          compact
          documentTypes={documentTypes}
          initialDocumentTypeId={group.documentTypeId}
          lockDocumentType
          submitLabel="Tambah dokumen"
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function DocumentReplaceAction({
  document,
  documentTypes,
}: {
  document: DocumentRecordListItem;
  documentTypes: DocumentTypeOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" size="xs" variant="outline" onClick={() => setOpen(true)}>
        <RefreshCw className="size-3.5" />
        <span className="hidden md:inline">Ganti</span>
      </Button>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ganti file dokumen</DialogTitle>
          <DialogDescription>
            {`Ganti file untuk "${document.title}". ID dokumen tetap sama dan riwayat verifikasi akan mencatat penggantian ini.`}
          </DialogDescription>
        </DialogHeader>
        <DocumentUploadForm
          compact
          documentTypes={documentTypes}
          initialDocumentTypeId={document.documentTypeId}
          initialValues={{
            title: document.title,
            documentNumber: document.documentNumber,
            issueDate: document.issueDate,
            expiryDate: document.expiryDate,
          }}
          lockDocumentType
          replaceDocumentId={document.id}
          submitLabel="Ganti file"
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function DocumentList({
  documents,
  documentTypes,
  pendingDocumentId,
  onArchive,
}: {
  documents: DocumentRecordListItem[];
  documentTypes: DocumentTypeOption[];
  pendingDocumentId: string | null;
  onArchive: (document: DocumentRecordListItem) => void;
}) {
  if (documents.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-muted/20 px-3 py-4 text-center text-xs text-muted-foreground">
        Belum ada dokumen aktif untuk jenis ini.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {documents.map((document) => {
        const config = statusConfig[document.status] ?? statusConfig.PENDING;
        const Icon = config.icon;
        return (
          <div
            key={document.id}
            className="flex flex-col gap-2 rounded-md border bg-card px-2.5 py-2 text-card-foreground sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex-1 space-y-0.5">
              <div className="text-sm font-medium">{document.title}</div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{document.fileName}</span>
                <span>·</span>
                <span>{formatFileSize(document.fileSize)}</span>
                <span>·</span>
                <span>Upload: {formatDate(document.uploadedAt)}</span>
                {document.expiryDate && (
                  <>
                    <span>·</span>
                    <span>Exp: {formatDate(document.expiryDate)}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <Badge variant={config.variant} className="h-5 gap-1 px-1.5 text-[11px]">
                  <Icon className="size-3" />
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {document.ownerName} · {document.ownerEmployeeId || "NIP belum ada"}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Link
                className={buttonVariants({ variant: "outline", size: "xs" })}
                href={routeTo.documentDetail(document.id)}
              >
                <FileText className="size-3.5" />
                <span className="hidden md:inline">Detail</span>
              </Link>
              <DocumentReplaceAction document={document} documentTypes={documentTypes} />
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="destructive"
                      size="xs"
                      disabled={pendingDocumentId === document.id}
                    />
                  }
                >
                  <Trash2 className="size-3.5" />
                  <span className="hidden md:inline">Hapus</span>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Arsipkan dokumen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {`Dokumen "${document.title}" akan dipindahkan ke arsip. Admin dapat melihat dan mengelolanya dari Master Data Dokumen.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={() => onArchive(document)}>
                      Arsipkan
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DocumentsPageView({ documents, documentTypes, canUpload }: DocumentsPageViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);

  const pendingCount = documents.filter((doc) => doc.status === "PENDING").length;
  const approvedCount = documents.filter((doc) => doc.status === "APPROVED").length;
  const rejectedCount = documents.filter((doc) => doc.status === "REJECTED").length;
  const expiringCount = documents.filter(
    (doc) =>
      doc.expiryDate && new Date(doc.expiryDate) < new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  ).length;

  const groupedDocuments = groupDocumentsByAvailableTypes(documents, documentTypes);

  const handleArchive = (document: DocumentRecordListItem) => {
    setPendingDocumentId(document.id);
    startTransition(async () => {
      const result = await softDeleteDocumentAction(document.id);
      if (result.ok) {
        toast.success(`Dokumen "${document.title}" berhasil diarsipkan.`);
        router.refresh();
        setPendingDocumentId(null);
        return;
      }

      toast.error(result.error.message);
      setPendingDocumentId(null);
    });
  };

  const documentMetricCards = [
    {
      title: "Total dokumen",
      value: documents.length,
      description: "Semua status dokumen aktif",
      icon: FileText,
      iconClassName: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Menunggu verifikasi",
      value: pendingCount,
      description: "Butuh review staf",
      icon: Clock3,
      iconClassName: "bg-amber-500/10 text-amber-500",
      valueClassName: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Aktif disetujui",
      value: approvedCount,
      description: "Dokumen valid aktif",
      icon: ShieldCheck,
      iconClassName: "bg-emerald-500/10 text-emerald-500",
      valueClassName: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Dokumen ditolak",
      value: rejectedCount,
      description: "Perlu tindak lanjut",
      icon: FileWarning,
      iconClassName: "bg-rose-500/10 text-rose-500",
      valueClassName: "text-rose-600 dark:text-rose-400",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dokumen pegawai"
        description="Unggah, pantau status, dan buka dokumen kepegawaian milik Anda."
      />

      {expiringCount > 0 ? (
        <Card className="border-rose-500/20 bg-rose-500/5 text-rose-800 dark:text-rose-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4" /> Peringatan Masa Berlaku Berkas
            </CardTitle>
            <CardDescription className="text-rose-700/90 dark:text-rose-300/90">
              {canUpload
                ? `Ada ${expiringCount} berkas Anda yang akan habis masa berlakunya dalam waktu kurang dari 30 hari. Segera unggah berkas terbaru untuk menjaga kepatuhan data dokumen.`
                : `Terdapat ${expiringCount} dokumen pegawai yang sudah atau akan kedaluwarsa dalam 30 hari.`}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {documentMetricCards.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {groupedDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center text-center">
            <div className="space-y-2">
              <FileText className="mx-auto size-12 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">Belum ada jenis dokumen yang tersedia.</p>
              {canUpload && (
                <p className="text-xs text-muted-foreground">
                  Jenis dokumen akan tampil di sini setelah admin mengaktifkannya untuk data kepegawaian Anda.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="hidden space-y-2.5 lg:block">
            {groupedDocuments.map((group) => {
              const Icon = archiveCategoryIcons[group.archiveCategory] || FileText;
              return (
                <Card key={group.documentTypeId} className="border-muted-foreground/10 shadow-sm">
                  <CardHeader className="px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <Icon className="size-3.5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-sm font-medium">{group.documentTypeName}</CardTitle>
                        <CardDescription className="text-xs">
                          {group.documents.length} dokumen · {group.archiveCategory}
                        </CardDescription>
                      </div>
                      {canUpload ? <DocumentTypeUploadAction group={group} documentTypes={documentTypes} /> : null}
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pt-0">
                    <Accordion>
                      <AccordionItem value="documents" className="border-b-0">
                        <AccordionTrigger className="text-xs font-medium hover:no-underline">Lihat daftar dokumen</AccordionTrigger>
                        <AccordionContent className="pb-0">
                          <DocumentList
                            documents={group.documents}
                            documentTypes={documentTypes}
                            pendingDocumentId={isPending ? pendingDocumentId : null}
                            onArchive={handleArchive}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="lg:hidden">
            <Card>
              <CardContent className="p-4">
                <Accordion>
                  {groupedDocuments.map((group) => {
                    const Icon = archiveCategoryIcons[group.archiveCategory] || FileText;
                    return (
                      <AccordionItem key={group.documentTypeId} value={group.documentTypeId}>
                        <div className="flex w-full items-center gap-2">
                          <AccordionTrigger className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-3 pr-2">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <Icon className="size-4 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1 text-left">
                                <div className="truncate text-sm font-medium">{group.documentTypeName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {group.documents.length} dokumen
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          {canUpload ? <DocumentTypeUploadAction group={group} documentTypes={documentTypes} /> : null}
                        </div>
                        <AccordionContent>
                          <DocumentList
                            documents={group.documents}
                            documentTypes={documentTypes}
                            pendingDocumentId={isPending ? pendingDocumentId : null}
                            onArchive={handleArchive}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
