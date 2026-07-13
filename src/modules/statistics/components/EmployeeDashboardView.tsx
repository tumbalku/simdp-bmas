"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  Plus,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RecentUpload = {
  id: string;
  documentName: string;
  category: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "REPLACED";
  uploadedAt: string;
  expiryDate: string | null;
};

type EmployeeDashboardStats = {
  recentUploads: RecentUpload[];
};

type EmployeeDashboardViewProps = {
  stats: EmployeeDashboardStats;
};

const CATEGORY_LABEL: Record<string, string> = {
  PERSONAL: "Pribadi",
  EDUCATION: "Pendidikan",
  EMPLOYMENT: "Kepegawaian",
  CERTIFICATION: "Sertifikasi",
  LEGAL: "Hukum",
};

const STATUS_BADGE: Record<string, { label: string; style: string }> = {
  PENDING: {
    label: "Menunggu Review",
    style: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20",
  },
  APPROVED: {
    label: "Disetujui",
    style: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20",
  },
  REJECTED: {
    label: "Ditolak",
    style: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20",
  },
  EXPIRED: {
    label: "Kedaluwarsa",
    style: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border border-red-500/20",
  },
  REPLACED: {
    label: "Digantikan",
    style: "bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border border-slate-500/20",
  },
};

export function EmployeeDashboardView({ stats }: EmployeeDashboardViewProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Beranda Pegawai"
        description="Lihat status berkas digital dan kelengkapan dokumen kepegawaian Anda."
        actions={[
          {
            label: "Lihat Dokumen",
            href: "/documents",
            icon: ArrowRight,
            iconPosition: "end",
            variant: "outline",
          },
          {
            label: "Unggah Berkas",
            href: "/documents?upload=true",
            icon: Plus,
          },
        ]}
      />

      {/* Recent Uploads Section */}
      <Card className="shadow-sm border-muted-foreground/10 bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Riwayat Berkas Terakhir</CardTitle>
          <CardDescription className="text-xs">Daftar 5 berkas terakhir yang Anda unggah beserta status verifikasinya.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {stats.recentUploads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                <FileText className="size-6" />
              </div>
              <h5 className="font-semibold text-sm text-foreground">Belum ada berkas</h5>
              <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                Anda belum pernah mengunggah berkas kepegawaian apapun ke sistem SIMDP.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-muted-foreground/10">
              {stats.recentUploads.map((doc) => {
                const status = STATUS_BADGE[doc.status] || { label: doc.status, style: "bg-muted" };
                return (
                  <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/5 text-primary border border-primary/10 shrink-0">
                        <FileText className="size-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-[400px]">
                          {doc.documentName}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {CATEGORY_LABEL[doc.category] || doc.category}
                          </span>
                          <span className="text-[10px] text-muted-foreground">•</span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            Diunggah: {formatDate(doc.uploadedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium leading-none", status.style)}>
                        {status.label}
                      </span>
                      <Link href={`/documents/${doc.id}`} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground">
                        <ChevronRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
