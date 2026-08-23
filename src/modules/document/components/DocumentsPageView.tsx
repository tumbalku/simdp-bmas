"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Clock3, Download, FileText, FileWarning, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DocumentCompletenessProgress } from "@/components/cards/DocumentCompletenessProgress";
import { MetricCard } from "@/components/cards/MetricCard";
import { PageHeader } from "@/components/navigation/PageHeader";
import { CriticalActionVerificationDialog } from "@/components/verification/CriticalActionVerificationDialog";
import { DocumentFilterCard } from "@/components/tables/DocumentFilterCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ARCHIVE_CATEGORY_OPTIONS, softDeleteDocumentAction } from "@/modules/document";
import { calculateMandatoryDocumentCompleteness } from "@/modules/document";
import { verifyCurrentPasswordAction } from "@/modules/auth";
import { downloadFileWithToast } from "@/utils/download";
import type { DocumentRecordListItem, DocumentTypeOption } from "@/modules/document";
import {
  archiveCategoryIcons,
  DocumentList,
  DocumentTypeUploadAction,
  groupDocumentsByAvailableTypes,
} from "@/modules/document/components/DocumentsGroupedList";

type DocumentsPageViewProps = {
  documents: DocumentRecordListItem[];
  allDocuments: DocumentRecordListItem[];
  documentTypes: DocumentTypeOption[];
  canUpload: boolean;
  currentRole: string;
  currentEmployeeId: string | null;
};

export function DocumentsPageView({
  documents,
  allDocuments,
  documentTypes,
  canUpload,
  currentEmployeeId,
}: DocumentsPageViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<DocumentRecordListItem | null>(null);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [documentTypeId, setDocumentTypeId] = useState(() => searchParams.get("documentTypeId") ?? "");
  const [archiveCategory, setArchiveCategory] = useState(() => searchParams.get("archiveCategory") ?? "");

  // Local state for filters before apply
  const [tempSearch, setTempSearch] = useState(search);
  const [tempDocumentTypeId, setTempDocumentTypeId] = useState(documentTypeId);
  const [tempArchiveCategory, setTempArchiveCategory] = useState(archiveCategory);

  // Sync state when URL params change (e.g. on reset or back navigation)
  const currentSearch = searchParams.get("search") ?? "";
  const currentDocumentTypeId = searchParams.get("documentTypeId") ?? "";
  const currentArchiveCategory = searchParams.get("archiveCategory") ?? "";

  useEffect(() => {
    setSearch(currentSearch);
    setTempSearch(currentSearch);
    setDocumentTypeId(currentDocumentTypeId);
    setTempDocumentTypeId(currentDocumentTypeId);
    setArchiveCategory(currentArchiveCategory);
    setTempArchiveCategory(currentArchiveCategory);
  }, [currentSearch, currentDocumentTypeId, currentArchiveCategory]);

  const pendingCount = allDocuments.filter((doc) => doc.status === "PENDING").length;
  const approvedCount = allDocuments.filter((doc) => doc.status === "APPROVED").length;
  const rejectedCount = allDocuments.filter((doc) => doc.status === "REJECTED").length;
  const expiringCount = allDocuments.filter(
    (doc) =>
      doc.expiryDate && new Date(doc.expiryDate) < new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  ).length;
  const mandatoryDocumentCompleteness = calculateMandatoryDocumentCompleteness({
    documentTypes,
    documents: allDocuments,
  });

  const isFilterActive = Boolean(search.trim() || documentTypeId || archiveCategory);
  
  // Selalu kelompokkan berdasarkan seluruh documentTypes agar info tipe dokumen (allowMultiple, dll) tetap lengkap
  const allGroupedDocuments = groupDocumentsByAvailableTypes(
    documents,
    documentTypes
  );

  // Saring kelompok dokumen (group) berdasarkan filter pencarian, tipe, dan kategori arsip
  const groupedDocuments = allGroupedDocuments.filter((group) => {
    // 1. Filter Tipe Dokumen (jika dipilih di filter dropdown)
    if (documentTypeId && group.documentTypeId !== documentTypeId) {
      return false;
    }

    // 2. Filter Kategori Arsip (jika dipilih di filter dropdown)
    if (archiveCategory && group.archiveCategory !== archiveCategory) {
      return false;
    }

    // 3. Filter Pencarian Text (Cari berdasarkan nama tipe dokumen, judul dokumen, atau nama file)
    if (search.trim()) {
      const searchLower = search.trim().toLowerCase();
      
      // Syarat A: Nama jenis dokumen mengandung kata pencarian
      const matchesTypeName = group.documentTypeName.toLowerCase().includes(searchLower);
      
      // Syarat B: Ada dokumen di dalam jenis ini yang cocok
      const matchesAnyDocument = group.documents.some(
        (doc) =>
          doc.title.toLowerCase().includes(searchLower) ||
          doc.fileName.toLowerCase().includes(searchLower)
      );

      return matchesTypeName || matchesAnyDocument;
    }

    // Jika tidak ada filter pencarian kata, atau semua filter di atas lolos
    return true;
  });

  const isActionPending = pendingDocumentId !== null;

  const buildDocumentsUrl = (
    nextSearch = tempSearch,
    nextDocumentTypeId = tempDocumentTypeId,
    nextArchiveCategory = tempArchiveCategory
  ) => {
    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextDocumentTypeId) params.set("documentTypeId", nextDocumentTypeId);
    if (nextArchiveCategory) params.set("archiveCategory", nextArchiveCategory);
    const query = params.toString();

    return query ? `/documents?${query}` : "/documents";
  };

  const handleDocumentTypeChange = (value: string | null) => {
    setTempDocumentTypeId(!value || value === "all" ? "" : value);
  };

  const handleArchiveCategoryChange = (value: string | null) => {
    setTempArchiveCategory(!value || value === "all" ? "" : value);
  };

  const handleApplyFilters = () => {
    setSearch(tempSearch);
    setDocumentTypeId(tempDocumentTypeId);
    setArchiveCategory(tempArchiveCategory);
    router.push(buildDocumentsUrl());
  };

  const handleResetFilters = () => {
    setTempSearch("");
    setTempDocumentTypeId("");
    setTempArchiveCategory("");
    setSearch("");
    setDocumentTypeId("");
    setArchiveCategory("");
    router.push("/documents");
  };

  const openArchiveDialog = (target: DocumentRecordListItem) => {
    setArchiveTarget(target);
    setIsArchiveDialogOpen(true);
  };

  const handleArchiveDialogOpenChange = (open: boolean) => {
    setIsArchiveDialogOpen(open);
    if (!open) {
      window.setTimeout(() => {
        setArchiveTarget(null);
      }, 200);
    }
  };

  const handleArchive = async (document: DocumentRecordListItem) => {
    setPendingDocumentId(document.id);
    try {
      const result = await softDeleteDocumentAction(document.id);
      if (result.ok) {
        toast.success(`Dokumen "${document.title}" berhasil dihapus.`);
        setIsArchiveDialogOpen(false);
        window.setTimeout(() => {
          setArchiveTarget(null);
          router.refresh();
        }, 200);
        return result;
      }

      toast.error(result.error.message);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Aksi hapus dokumen gagal dijalankan.";
      toast.error(message);
      return { ok: false as const, error: { message } };
    } finally {
      setPendingDocumentId(null);
    }
  };

  const documentMetricCards = [
    {
      title: "Total dokumen",
      compactTitle: "Total",
      value: allDocuments.length,
      description: "Semua status dokumen aktif",
      icon: FileText,
      iconClassName: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Menunggu verifikasi",
      compactTitle: "Menunggu",
      value: pendingCount,
      description: "Butuh review staf",
      icon: Clock3,
      iconClassName: "bg-amber-500/10 text-amber-500",
      valueClassName: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Aktif disetujui",
      compactTitle: "Aktif",
      value: approvedCount,
      description: "Dokumen valid aktif",
      icon: ShieldCheck,
      iconClassName: "bg-emerald-500/10 text-emerald-500",
      valueClassName: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Dokumen ditolak",
      compactTitle: "Ditolak",
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
        eyebrow="Dokumen"
        title="Dokumen pegawai"
        description="Unggah, pantau status, dan buka dokumen kepegawaian milik Anda."
        actions={
          currentEmployeeId
            ? [
                {
                  label: "Download PDF",
                  onClick: () =>
                    downloadFileWithToast({
                      url: `/api/v1/employees/${currentEmployeeId}/documents-pdf`,
                      loadingMessage: "Memproses unduhan berkas PDF...",
                      successMessage: "Berkas PDF berhasil diunduh.",
                      defaultFilename: "dokumen-pegawai.pdf",
                    }),
                  icon: Download,
                  variant: "default",
                  hideLabelOnMobile: true,
                },
              ]
            : undefined
        }
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

      <div className="grid grid-cols-4 gap-1.5 sm:gap-4">
        {documentMetricCards.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <DocumentCompletenessProgress
        completed={mandatoryDocumentCompleteness.completed}
        total={mandatoryDocumentCompleteness.total}
      />


      <DocumentFilterCard
        description="Cari berdasarkan nama file, judul, atau jenis dokumen."
        search={tempSearch}
        onSearchChange={setTempSearch}
        searchPlaceholder="Cari dokumen..."
        documentTypeId={tempDocumentTypeId}
        onDocumentTypeChange={handleDocumentTypeChange}
        documentTypes={documentTypes}
        categoryFilter={tempArchiveCategory}
        onCategoryChange={handleArchiveCategoryChange}
        archiveCategoryOptions={ARCHIVE_CATEGORY_OPTIONS}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {groupedDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center text-center">
            <div className="space-y-2">
              <FileText className="mx-auto size-12 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                {isFilterActive ? "Tidak ada dokumen yang sesuai filter." : "Belum ada jenis dokumen yang tersedia."}
              </p>
              {canUpload && !isFilterActive ? (
                <p className="text-xs text-muted-foreground">
                  Jenis dokumen akan tampil di sini setelah admin mengaktifkannya untuk data kepegawaian Anda.
                </p>
              ) : null}
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
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CardTitle className="truncate text-sm font-medium">{group.documentTypeName}</CardTitle>
                          {group.isMandatory ? (
                            <Badge variant="default" className="h-4 shrink-0 px-1 text-[10px] font-semibold">
                              Wajib
                            </Badge>
                          ) : null}
                        </div>
                        <CardDescription className="text-xs">
                          {group.documents.length} dokumen · {group.archiveCategory}
                        </CardDescription>
                      </div>
                      {canUpload ? <DocumentTypeUploadAction group={group} documentTypes={documentTypes} /> : null}
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pt-0">
                    <Accordion>
                      <AccordionItem value={`docs-${group.documentTypeId}`} className="border-b-0">
                        <AccordionTrigger className="text-xs font-medium hover:no-underline">Lihat daftar dokumen</AccordionTrigger>
                        <AccordionContent className="pb-0">
                        <DocumentList
                          documents={group.documents}
                          documentTypes={documentTypes}
                          pendingDocumentId={pendingDocumentId}
                          onArchive={openArchiveDialog}
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
                          <AccordionTrigger className="min-w-0 flex-1 overflow-hidden">
                            <span className="flex min-w-0 flex-1 items-center gap-3 pr-2">
                              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <Icon className="size-5 text-primary" />
                              </span>
                              <span className="min-w-0 max-w-[10rem] flex-1 overflow-hidden text-left sm:max-w-none">
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <span className="block truncate text-sm font-medium" title={group.documentTypeName}>
                                    {group.documentTypeName}
                                  </span>
                                  {group.isMandatory ? (
                                    <Badge variant="default" className="h-4 shrink-0 px-1 text-[10px] font-semibold">
                                      Wajib
                                    </Badge>
                                  ) : null}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  {group.documents.length} dokumen
                                </span>
                              </span>
                            </span>
                          </AccordionTrigger>
                          {canUpload ? <DocumentTypeUploadAction group={group} documentTypes={documentTypes} /> : null}
                        </div>
                        <AccordionContent>
                          <DocumentList
                            documents={group.documents}
                            documentTypes={documentTypes}
                            pendingDocumentId={pendingDocumentId}
                            onArchive={openArchiveDialog}
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

      <CriticalActionVerificationDialog
        open={isArchiveDialogOpen}
        onOpenChange={handleArchiveDialogOpenChange}
        title="Verifikasi hapus dokumen"
        description="Tindakan ini membutuhkan verifikasi sebelum dokumen dihapus."
        actionLabel="Hapus"
        targetLabel="dokumen aktif"
        targetValue={archiveTarget?.fileName ?? ""}
        confirmationPhrase={archiveTarget?.fileName ?? ""}
        impacts={[
          "Dokumen akan terhapus.",
          "Harus menghubungi ADMIN jika tidak sengaja menghapus dokumen.",
          "Aktivitas penghapusan akan dicatat di audit.",
        ]}
        tone="destructive"
        icon={<Trash2 className="size-4" />}
        isPending={isActionPending}
        onVerifyPassword={(password) => verifyCurrentPasswordAction({ password })}
        onConfirm={archiveTarget ? () => handleArchive(archiveTarget) : () => {}}
      />
    </div>
  );
}
