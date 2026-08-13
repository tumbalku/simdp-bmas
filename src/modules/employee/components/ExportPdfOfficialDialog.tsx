"use client";

import { FileText } from "lucide-react";
import { toast } from "sonner";
import { downloadFileWithToast } from "@/utils/download";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OfficialForm } from "../hooks/useEmployeesViewState";

export type DirectorOption = {
  id: string;
  name: string;
  nip: string | null;
  position: string | null;
  rank: string | null;
};

export type ExportPdfOfficialDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  officialForm: OfficialForm;
  onOfficialFieldChange: (key: keyof OfficialForm, value: string) => void;
  onOfficialSelect: (employeeId: string | null) => void;
  directorOptions: DirectorOption[];
  buildExportPdfUrl: (official: OfficialForm) => string;
};

export function ExportPdfOfficialDialog({
  open,
  onOpenChange,
  officialForm,
  onOfficialFieldChange,
  onOfficialSelect,
  directorOptions,
  buildExportPdfUrl,
}: ExportPdfOfficialDialogProps) {
  const handleExportPdf = () => {
    const normalizedOfficial = {
      employeeId: officialForm.employeeId,
      name: officialForm.name.trim(),
      position: officialForm.position.trim(),
      rank: officialForm.rank.trim(),
      nip: officialForm.nip.trim(),
    };

    if (
      !normalizedOfficial.name ||
      !normalizedOfficial.position ||
      !normalizedOfficial.rank ||
      !normalizedOfficial.nip
    ) {
      toast.error(
        "Nama, jabatan, pangkat/golongan, dan NIP Pejabat wajib diisi sebelum export PDF.",
      );
      return;
    }

    onOpenChange(false);
    void downloadFileWithToast({
      url: buildExportPdfUrl(normalizedOfficial),
      loadingMessage: "Memproses laporan PDF kepegawaian...",
      successMessage: "PDF laporan kepegawaian berhasil diunduh.",
      defaultFilename: "Laporan_Pegawai.pdf",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pilih Pejabat</DialogTitle>
          <DialogDescription>
            Data ini akan dipakai pada area tanda tangan PDF laporan kepegawaian.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="export-pdf-official-employee">Pejabat</Label>
            <Select
              value={officialForm.employeeId || null}
              onValueChange={onOfficialSelect}
            >
              <SelectTrigger id="export-pdf-official-employee">
                <SelectValue placeholder="Pilih pegawai sebagai pejabat" />
              </SelectTrigger>
              <SelectContent>
                {directorOptions.map((official) => (
                  <SelectItem key={official.id} value={official.id}>
                    {official.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="export-pdf-official-name">Nama Pejabat</Label>
            <Input
              id="export-pdf-official-name"
              value={officialForm.name}
              onChange={(event) =>
                onOfficialFieldChange("name", event.target.value)
              }
              placeholder="Nama lengkap pejabat"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="export-pdf-official-position">Jabatan</Label>
            <Input
              id="export-pdf-official-position"
              value={officialForm.position}
              onChange={(event) =>
                onOfficialFieldChange("position", event.target.value)
              }
              placeholder="Contoh: Direktur"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="export-pdf-official-rank">Pangkat/Golongan</Label>
            <Input
              id="export-pdf-official-rank"
              value={officialForm.rank}
              onChange={(event) =>
                onOfficialFieldChange("rank", event.target.value)
              }
              placeholder="Contoh: Pembina Utama Muda, Gol.IV/c"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="export-pdf-official-nip">NIP Pejabat</Label>
            <Input
              id="export-pdf-official-nip"
              value={officialForm.nip}
              onChange={(event) =>
                onOfficialFieldChange("nip", event.target.value)
              }
              placeholder="NIP Pejabat"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button type="button" onClick={handleExportPdf}>
            <FileText className="size-3.5" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
