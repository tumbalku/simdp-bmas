"use client";

import { useMemo, useState } from "react";
import { Download, FileCheck2, FileText, Layers3 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DOCUMENT_STATUS_OPTIONS, type DocumentStatus } from "@/modules/document";

const DOCUMENT_STATUS_DESCRIPTIONS: Record<DocumentStatus, string> = {
  PENDING: "Dokumen yang masih menunggu verifikasi.",
  APPROVED: "Dokumen yang sudah disetujui petugas.",
  REJECTED: "Dokumen yang ditolak dan perlu perbaikan.",
  EXPIRED: "Dokumen yang sudah melewati tanggal berlaku.",
  REPLACED: "Dokumen lama yang sudah diganti versi baru.",
};

type EmployeeProfilePdfDownloadDialogProps = {
  employeeId: string;
  employeeName: string;
  triggerLabel?: string;
};

function toggleStatus(current: DocumentStatus[], status: DocumentStatus, checked: boolean) {
  if (checked) {
    return current.includes(status) ? current : [...current, status];
  }

  return current.filter((item) => item !== status);
}

export function EmployeeProfilePdfDownloadDialog({
  employeeId,
  employeeName,
  triggerLabel = "Unduh",
}: EmployeeProfilePdfDownloadDialogProps) {
  const [open, setOpen] = useState(false);
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includeAllDocuments, setIncludeAllDocuments] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<DocumentStatus[]>(["APPROVED"]);

  const canDownload = includeProfile || includeAllDocuments || selectedStatuses.length > 0;
  const selectedSummary = useMemo(() => {
    if (includeAllDocuments) return "Semua metadata dokumen akan disertakan.";
    if (selectedStatuses.length > 0) {
      return `${selectedStatuses.length} status dokumen dipilih.`;
    }
    return "Tanpa metadata dokumen.";
  }, [includeAllDocuments, selectedStatuses.length]);

  const handleDownload = () => {
    if (!canDownload) {
      toast.error("Pilih minimal profil atau dokumen untuk dicetak.");
      return;
    }

    const params = new URLSearchParams();
    params.set("profile", includeProfile ? "1" : "0");

    if (includeAllDocuments) {
      params.set("documents", "all");
    } else if (selectedStatuses.length > 0) {
      params.set("documents", "status");
      selectedStatuses.forEach((status) => params.append("status", status));
    } else {
      params.set("documents", "none");
    }

    setOpen(false);
    window.location.href = `/api/v1/employees/${employeeId}/profile-pdf?${params.toString()}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Download className="size-3.5" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileText className="size-5" />
          </div>
          <DialogTitle>Unduh Detail Pegawai</DialogTitle>
          <DialogDescription>
            Pilih konten PDF untuk {employeeName}. File dokumen asli tidak ikut disertakan, hanya metadata.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-xl border bg-muted/20 p-3">
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={includeProfile}
                onCheckedChange={(checked) => setIncludeProfile(checked === true)}
                aria-label="Cetak profil pegawai"
              />
              <span className="space-y-0.5">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <FileCheck2 className="size-3.5 text-primary" />
                  Cetak profil saja / detail pengguna
                </span>
                <span className="block text-xs text-muted-foreground">
                  Identitas, kontak, status kepegawaian, jabatan, unit kerja, dan metadata profil.
                </span>
              </span>
            </label>
          </div>

          <div className="rounded-xl border bg-background p-3">
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={includeAllDocuments}
                onCheckedChange={(checked) => setIncludeAllDocuments(checked === true)}
                aria-label="Cetak semua metadata dokumen"
              />
              <span className="space-y-0.5">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Layers3 className="size-3.5 text-primary" />
                  Cetak semua dokumen
                </span>
                <span className="block text-xs text-muted-foreground">
                  Sertakan seluruh metadata dokumen, tanpa memfilter status.
                </span>
              </span>
            </label>
          </div>

          <div className="rounded-xl border bg-card p-3">
            <div className="mb-2">
              <p className="text-sm font-semibold text-foreground">Cetak dokumen berdasarkan status</p>
              <p className="text-xs text-muted-foreground">
                Bisa dipilih beberapa kombinasi. Opsi ini diabaikan jika “seluruh” aktif.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {DOCUMENT_STATUS_OPTIONS.map((option) => (
                <Label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-2 rounded-lg border bg-background/60 p-2 hover:bg-muted/40"
                >
                  <Checkbox
                    checked={!includeAllDocuments && selectedStatuses.includes(option.value)}
                    disabled={includeAllDocuments}
                    onCheckedChange={(checked) => {
                      setSelectedStatuses((current) => toggleStatus(current, option.value, checked === true));
                    }}
                    aria-label={`Cetak dokumen ${option.label}`}
                  />
                  <span>
                    <span className="block text-xs font-semibold text-foreground">Cetak dokumen {option.label.toLowerCase()}</span>
                    <span className="block text-[10px] leading-4 text-muted-foreground">
                      {DOCUMENT_STATUS_DESCRIPTIONS[option.value]}
                    </span>
                  </span>
                </Label>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            Ringkasan: {includeProfile ? "Profil disertakan. " : "Profil tidak disertakan. "}{selectedSummary}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button type="button" onClick={handleDownload} disabled={!canDownload}>
            <Download className="size-3.5" />
            Unduh PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
