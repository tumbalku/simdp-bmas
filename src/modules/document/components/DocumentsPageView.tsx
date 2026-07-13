import Link from "next/link";
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
} from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DATE_FORMATS, DATE_LOCALE, routeTo } from "@/constants";
import { DocumentUploadForm } from "@/modules/document/components/DocumentUploadForm";
import { DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_VARIANTS } from "@/modules/document/constants";

type DocumentRecord = {
  id: string;
  title: string;
  status: string;
  uploadedAt: string;
  expiryDate: string | null;
  fileName: string;
  fileSize: number | null;
  documentTypeId: string;
  documentTypeName: string;
  archiveCategory: string;
  ownerName: string;
  ownerEmployeeId: string | null;
};

type DocumentTypeOption = Parameters<typeof DocumentUploadForm>[0]["documentTypes"][number];

type DocumentsPageViewProps = {
  documents: DocumentRecord[];
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
  documents: DocumentRecord[];
};

function groupDocumentsByType(documents: DocumentRecord[]): GroupedDocuments[] {
  const grouped = new Map<string, GroupedDocuments>();

  for (const doc of documents) {
    if (!grouped.has(doc.documentTypeId)) {
      grouped.set(doc.documentTypeId, {
        documentTypeId: doc.documentTypeId,
        documentTypeName: doc.documentTypeName,
        archiveCategory: doc.archiveCategory,
        documents: [],
      });
    }
    grouped.get(doc.documentTypeId)!.documents.push(doc);
  }

  return Array.from(grouped.values()).sort((a, b) =>
    a.documentTypeName.localeCompare(b.documentTypeName)
  );
}

function DocumentList({ documents }: { documents: DocumentRecord[] }) {
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
            <div>
              <Link
                className={buttonVariants({ variant: "outline", size: "xs" })}
                href={routeTo.documentDetail(document.id)}
              >
                Detail
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DocumentsPageView({ documents, documentTypes, canUpload }: DocumentsPageViewProps) {
  const pendingCount = documents.filter((doc) => doc.status === "PENDING").length;
  const approvedCount = documents.filter((doc) => doc.status === "APPROVED").length;
  const rejectedCount = documents.filter((doc) => doc.status === "REJECTED").length;
  const expiringCount = documents.filter(
    (doc) =>
      doc.expiryDate && new Date(doc.expiryDate) < new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
  ).length;

  const groupedDocuments = groupDocumentsByType(documents);

  const documentMetricCards = [
    {
      title: "Total dokumen",
      value: documents.length,
      description: "Semua status dokumen",
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
        description="Unggah, pantau status, dan buka dokumen kepegawaian sesuai akses pengguna."
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

      {canUpload ? <DocumentUploadForm documentTypes={documentTypes} /> : null}

      {groupedDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center text-center">
            <div className="space-y-2">
              <FileText className="mx-auto size-12 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">Belum ada dokumen.</p>
              {canUpload && (
                <p className="text-xs text-muted-foreground">
                  Unggah dokumen pertama Anda menggunakan form di atas.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Desktop: Card wrapper with Accordion content */}
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
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pt-0">
                    <Accordion>
                      <AccordionItem value="documents" className="border-b-0">
                        <AccordionTrigger className="text-xs font-medium hover:no-underline">Lihat daftar dokumen</AccordionTrigger>
                        <AccordionContent className="pb-0">
                          <DocumentList documents={group.documents} />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Mobile: Pure Accordion */}
          <div className="lg:hidden">
            <Card>
              <CardContent className="p-4">
                <Accordion>
                  {groupedDocuments.map((group) => {
                    const Icon = archiveCategoryIcons[group.archiveCategory] || FileText;
                    return (
                      <AccordionItem key={group.documentTypeId} value={group.documentTypeId}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                              <Icon className="size-4 text-primary" />
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-medium">{group.documentTypeName}</div>
                              <div className="text-xs text-muted-foreground">
                                {group.documents.length} dokumen
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <DocumentList documents={group.documents} />
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
