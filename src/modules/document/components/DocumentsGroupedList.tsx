"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Award,
  Briefcase,
  Clock3,
  FileText,
  GraduationCap,
  Plus,
  RefreshCw,
  Scale,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DATE_FORMATS, DATE_LOCALE, routeTo } from "@/constants";
import { DocumentUploadForm } from "@/modules/document/components/DocumentUploadForm";
import { DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_VARIANTS } from "@/modules/document";
import type { DocumentRecordListItem, DocumentTypeOption } from "@/modules/document";

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

export const archiveCategoryIcons: Record<string, typeof FileText> = {
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

export type GroupedDocuments = {
  documentTypeId: string;
  documentTypeName: string;
  archiveCategory: string;
  allowMultiple: boolean;
  documentType?: DocumentTypeOption;
  documents: DocumentRecordListItem[];
};

export function groupDocumentsByAvailableTypes(
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

export function DocumentTypeUploadAction({
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

export function DocumentReplaceAction({
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

export function DocumentList({
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

