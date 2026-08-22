"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  FileText,
  Printer,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageHeaderButton } from "@/components/navigation/PageHeader";
import { DocumentReviewLayout } from "@/modules/document/components/document-review";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/utils";
import { downloadFileWithToast } from "@/utils/download";
import type { DirectorOption } from "./ExportPdfOfficialDialog";

export type PdfPaperSizeOption = "A4" | "F4" | "LEGAL" | "LETTER" | "A3";
export type PdfOrientationOption = "landscape" | "portrait";

type EmployeeExportPageViewProps = {
  directorOptions: DirectorOption[];
  initialQueryParams: Record<string, string>;
};

const PAPER_SIZES: { value: PdfPaperSizeOption; label: string; description: string }[] = [
  { value: "A4", label: "A4", description: "210 × 297 mm (Standar Internasional)" },
  { value: "F4", label: "F4 / Folio", description: "215 × 330 mm (Standar Persuratan Indonesia)" },
  { value: "LEGAL", label: "Legal", description: "215.9 × 355.6 mm (Ukuran Panjang)" },
  { value: "LETTER", label: "Letter", description: "215.9 × 279.4 mm (Ukuran Kuarto)" },
  { value: "A3", label: "A3", description: "297 × 420 mm (Format Lebar/Cetak Besar)" },
];

const ORIENTATIONS: { value: PdfOrientationOption; label: string }[] = [
  { value: "landscape", label: "Lanskap (Horizontal - Direkomendasikan)" },
  { value: "portrait", label: "Potret (Vertikal)" },
];

export function EmployeeExportPageView({
  directorOptions,
  initialQueryParams,
}: EmployeeExportPageViewProps) {
  // Form states
  const [paperSize, setPaperSize] = useState<PdfPaperSizeOption>(
    (initialQueryParams.paperSize as PdfPaperSizeOption) || "A4"
  );
  const [orientation, setOrientation] = useState<PdfOrientationOption>(
    (initialQueryParams.orientation as PdfOrientationOption) || "landscape"
  );
  const [includeSignature, setIncludeSignature] = useState<boolean>(
    initialQueryParams.includeSignature !== "0" && initialQueryParams.includeSignature !== "false"
  );

  // Official signatory states
  const defaultDirector = directorOptions[0];
  const [selectedOfficialId, setSelectedOfficialId] = useState<string | null>(
    defaultDirector?.id || null
  );
  const [officialForm, setOfficialForm] = useState({
    name: defaultDirector?.name || "",
    position: defaultDirector?.position || "Direktur RSUD Bahteramas",
    rank: defaultDirector?.rank || "Pembina Utama Muda, Gol.IV/c",
    nip: defaultDirector?.nip || "",
  });

  const [previewKey, setPreviewKey] = useState<number>(0);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(true);

  // Debounce officialForm text inputs to prevent excessive preview iframe requests
  const [debouncedOfficialForm, setDebouncedOfficialForm] = useState(officialForm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOfficialForm(officialForm);
    }, 500);
    return () => clearTimeout(timer);
  }, [officialForm]);

  const handleOfficialSelect = (employeeId: string | null) => {
    setSelectedOfficialId(employeeId);
    const selected = directorOptions.find((d) => d.id === employeeId);
    if (selected) {
      const nextForm = {
        name: selected.name,
        position: selected.position || "Direktur RSUD Bahteramas",
        rank: selected.rank || "Pembina Utama Muda, Gol.IV/c",
        nip: selected.nip || "",
      };
      setOfficialForm(nextForm);
      setDebouncedOfficialForm(nextForm);
    }
  };

  // Build params helper
  const buildQueryParams = useCallback(
    (isPreview: boolean) => {
      const params = new URLSearchParams();

      // Copy original filters (search, workplaceId, etc.)
      Object.entries(initialQueryParams).forEach(([key, val]) => {
        if (
          val &&
          ![
            "paperSize",
            "orientation",
            "includeSignature",
            "preview",
            "officialName",
            "officialPosition",
            "officialRank",
            "officialNip",
            "directorName",
            "directorPosition",
            "directorRank",
            "directorNip",
          ].includes(key)
        ) {
          params.set(key, val);
        }
      });

      params.set("paperSize", paperSize);
      params.set("orientation", orientation);
      params.set("includeSignature", includeSignature ? "1" : "0");

      if (includeSignature) {
        const formToUse = isPreview ? debouncedOfficialForm : officialForm;
        params.set("officialName", formToUse.name.trim());
        params.set("officialPosition", formToUse.position.trim());
        params.set("officialRank", formToUse.rank.trim());
        params.set("officialNip", formToUse.nip.trim());
      }

      if (isPreview) {
        params.set("preview", "1");
      }

      return params.toString();
    },
    [initialQueryParams, paperSize, orientation, includeSignature, officialForm, debouncedOfficialForm]
  );

  const previewUrl = useMemo(() => {
    const query = buildQueryParams(true);
    return `/api/v1/employees/export-pdf?${query}`;
  }, [buildQueryParams]);

  const handleDownload = () => {
    if (includeSignature) {
      if (
        !officialForm.name.trim() ||
        !officialForm.position.trim() ||
        !officialForm.rank.trim() ||
        !officialForm.nip.trim()
      ) {
        toast.error("Nama, jabatan, pangkat, dan NIP pejabat wajib diisi.");
        return;
      }
    }

    const query = buildQueryParams(false);
    void downloadFileWithToast({
      url: `/api/v1/employees/export-pdf?${query}`,
      loadingMessage: "Memproses laporan PDF kepegawaian...",
      successMessage: "PDF laporan kepegawaian berhasil diunduh.",
      defaultFilename: "Laporan_Pegawai.pdf",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kepegawaian"
        title="Export PDF Data Pegawai"
        description="Konfigurasi format cetak dan pratinjau dokumen PDF."
        backHref="/master-data/employees"
        backLabel="Kembali ke Data Pegawai"
        trailing={
          <PageHeaderButton
            label="Download PDF"
            icon={Download}
            onClick={handleDownload}
          />
        }
      />

      <DocumentReviewLayout
        preview={
          <Card className="flex min-h-[620px] flex-col overflow-hidden border-0 shadow-none lg:h-[calc(100vh-8rem)]">
            <CardHeader className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="size-4" />
                  Pratinjau Berkas
                </CardTitle>
                <CardDescription className="text-xs">
                  {`Format ${paperSize} (${orientation === "landscape" ? "Lanskap" : "Potret"})`}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsPreviewLoading(true);
                  setPreviewKey((k) => k + 1);
                }}
              >
                <RefreshCw className={cn("mr-1.5 size-3.5", isPreviewLoading && "animate-spin")} />
                Refresh Preview
              </Button>
            </CardHeader>
            <CardContent className="relative min-h-0 flex-1 p-0">
              {isPreviewLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-xs text-xs text-muted-foreground">
                  <RefreshCw className="size-6 animate-spin text-primary" />
                  <span>Memuat pratinjau dokumen PDF...</span>
                </div>
              )}
              <iframe
                key={`${previewUrl}-${previewKey}`}
                src={previewUrl}
                className="h-full min-h-[560px] w-full border-0 bg-muted"
                onLoad={() => setIsPreviewLoading(false)}
                title="Pratinjau PDF Laporan Kepegawaian"
              />
            </CardContent>
          </Card>
        }
        sidebar={
          <>
            {/* Card: Paper & Layout */}
            <Card className="border-muted-foreground/10 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Printer className="size-4 text-primary" />
                  Pengaturan Kertas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Paper Size */}
                <div className="space-y-1.5">
                  <Label htmlFor="export-paper-size" className="text-xs font-medium">
                    Ukuran Kertas
                  </Label>
                  <Select
                    value={paperSize}
                    onValueChange={(val) => setPaperSize(val as PdfPaperSizeOption)}
                  >
                    <SelectTrigger id="export-paper-size">
                      <SelectValue placeholder="Pilih ukuran kertas" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAPER_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          <span className="flex flex-col text-left">
                            <span className="font-medium">{size.label}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {size.description}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Orientation */}
                <div className="space-y-1.5">
                  <Label htmlFor="export-orientation" className="text-xs font-medium">
                    Orientasi Halaman
                  </Label>
                  <Select
                    value={orientation}
                    onValueChange={(val) => setOrientation(val as PdfOrientationOption)}
                  >
                    <SelectTrigger id="export-orientation">
                      <SelectValue placeholder="Pilih orientasi" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORIENTATIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Card: Signature & Official */}
            <Card className="border-muted-foreground/10 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Sliders className="size-4 text-primary" />
                    Pengesahan
                  </CardTitle>
                  <Switch
                    checked={includeSignature}
                    onCheckedChange={setIncludeSignature}
                    aria-label="Sertakan Tanda Tangan"
                  />
                </div>
                <CardDescription className="hidden sm:block text-xs">
                  Pengesahan dan pejabat penandatangan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 pt-0">
                <div className="space-y-1.5">
                  <Label htmlFor="export-official-select" className="text-xs font-medium">
                    Pilih Pejabat Penandatangan
                  </Label>
                  <Select
                    value={selectedOfficialId || undefined}
                    onValueChange={handleOfficialSelect}
                    disabled={!includeSignature}
                  >
                    <SelectTrigger id="export-official-select">
                      <SelectValue placeholder="Pilih pejabat dari direktori" />
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

                <div className="space-y-1.5">
                  <Label htmlFor="export-official-name" className="text-xs font-medium">
                    Nama Pejabat
                  </Label>
                  <Input
                    id="export-official-name"
                    value={officialForm.name}
                    onChange={(e) =>
                      setOfficialForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Nama lengkap & gelar"
                    disabled={!includeSignature}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="export-official-position" className="text-xs font-medium">
                    Jabatan
                  </Label>
                  <Input
                    id="export-official-position"
                    value={officialForm.position}
                    onChange={(e) =>
                      setOfficialForm((prev) => ({ ...prev, position: e.target.value }))
                    }
                    placeholder="Jabatan resmi"
                    disabled={!includeSignature}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="export-official-rank" className="text-xs font-medium">
                    Pangkat / Golongan
                  </Label>
                  <Input
                    id="export-official-rank"
                    value={officialForm.rank}
                    onChange={(e) =>
                      setOfficialForm((prev) => ({ ...prev, rank: e.target.value }))
                    }
                    placeholder="Pangkat dan Golongan Ruang"
                    disabled={!includeSignature}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="export-official-nip" className="text-xs font-medium">
                    NIP Pejabat
                  </Label>
                  <Input
                    id="export-official-nip"
                    value={officialForm.nip}
                    onChange={(e) =>
                      setOfficialForm((prev) => ({ ...prev, nip: e.target.value }))
                    }
                    placeholder="NIP Pejabat"
                    disabled={!includeSignature}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        }
      />
    </div>
  );
}
