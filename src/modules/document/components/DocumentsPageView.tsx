"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Clock3, FileText, FileWarning, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { softDeleteDocumentAction } from "@/modules/document/actions";
import type { DocumentRecordListItem, DocumentTypeOption } from "@/modules/document/types";
import {
  archiveCategoryIcons,
  DocumentList,
  DocumentTypeUploadAction,
  groupDocumentsByAvailableTypes,
} from "@/modules/document/components/DocumentsGroupedList";

type DocumentsPageViewProps = {
  documents: DocumentRecordListItem[];
  documentTypes: DocumentTypeOption[];
  canUpload: boolean;
};

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
