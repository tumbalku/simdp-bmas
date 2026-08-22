"use client";

import Link from "next/link";
import { Loader2, Save } from "lucide-react";

import { PageHeader } from "@/components/navigation/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/constants";
import { ARCHIVE_CATEGORY_OPTIONS } from "@/modules/document";
import {
  useDocumentTypeForm,
  FORMAT_OPTIONS,
  VALIDATION_OPTIONS,
  type MasterDataOption,
  type EmployeeGroupOption,
  type EmployeePositionOption,
} from "../hooks/useDocumentTypeForm";

type DocumentTypeFormPageProps = {
  mode?: "create" | "edit";
  documentTypeId?: string;
  initialData?: DocumentTypeFormInitialData;
  employmentStatuses: MasterDataOption[];
  employeeGroups: EmployeeGroupOption[];
  professionGroups: MasterDataOption[];
  employeePositions: EmployeePositionOption[];
  employeeRanks: MasterDataOption[];
  workplaces: MasterDataOption[];
};

export type DocumentTypeFormInitialData = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  archiveCategory: string;
  allowedFormats: string;
  maxSizeMb: number;
  employmentStatusIds: string[];
  employeeGroupIds: string[];
  professionGroupIds: string[];
  employeePositionIds: string[];
  employeeRankIds: string[];
  workplaceIds: string[];
  isMandatory: boolean;
  requiresExpiryDate: boolean;
  requiresIssueDate: boolean;
  requiresDocumentNumber: boolean;
  allowMultiple: boolean;
};

function OptionChecklist({
  options,
  selected,
  onToggle,
  emptyText,
}: {
  options: MasterDataOption[];
  selected: string[];
  onToggle: (id: string, checked: boolean) => void;
  emptyText: string;
}) {
  if (options.length === 0) {
    return <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{emptyText}</div>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const checked = selected.includes(option.id);

        return (
          <div
            key={option.id}
            role="button"
            tabIndex={0}
            className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => onToggle(option.id, !checked)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onToggle(option.id, !checked);
              }
            }}
          >
            <Checkbox
              checked={checked}
              className="pointer-events-none mt-0.5"
              aria-hidden="true"
            />
            <span className="leading-5">{option.name}</span>
          </div>
        );
      })}
    </div>
  );
}

function TreeItem({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <li className="relative pl-5">
      <span className="absolute left-0 top-2 size-2 rounded-full border border-primary/40 bg-primary/15" />
      <span className="font-medium text-foreground">{label}</span>
      {children ? <ul className="mt-2 space-y-2 border-l border-border/80 pl-4 text-muted-foreground">{children}</ul> : null}
    </li>
  );
}

function TargetTreePreview({
  employmentStatuses,
  employeeGroups,
  professionGroups,
  employeePositions,
  employeeRanks,
  workplaces,
  employmentStatusIds,
  employeeGroupIds,
  professionGroupIds,
  employeePositionIds,
  employeeRankIds,
  workplaceIds,
}: {
  employmentStatuses: MasterDataOption[];
  employeeGroups: EmployeeGroupOption[];
  professionGroups: MasterDataOption[];
  employeePositions: EmployeePositionOption[];
  employeeRanks: MasterDataOption[];
  workplaces: MasterDataOption[];
  employmentStatusIds: string[];
  employeeGroupIds: string[];
  professionGroupIds: string[];
  employeePositionIds: string[];
  employeeRankIds: string[];
  workplaceIds: string[];
}) {
  const selectedStatuses = employmentStatuses.filter((item) => employmentStatusIds.includes(item.id));
  const selectedProfessionGroups = professionGroups.filter((item) => professionGroupIds.includes(item.id));
  const selectedRanks = employeeRanks.filter((item) => employeeRankIds.includes(item.id));
  const selectedWorkplaces = workplaces.filter((item) => workplaceIds.includes(item.id));

  if (
    employmentStatusIds.length === 0 &&
    professionGroupIds.length === 0 &&
    employeeRankIds.length === 0 &&
    workplaceIds.length === 0
  ) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Semua target kosong. Jenis dokumen ini berlaku untuk semua pegawai.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border bg-background p-4">
        <div className="mb-3 text-sm font-medium">Status & Jenis Kepegawaian</div>
        {selectedStatuses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum memilih status kepegawaian.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {selectedStatuses.map((status) => {
              const children = employeeGroups.filter(
                (group) => group.employmentStatusId === status.id && (employeeGroupIds.length === 0 || employeeGroupIds.includes(group.id)),
              );

              return (
                <TreeItem key={status.id} label={status.name}>
                  {children.length > 0 ? children.map((group) => <TreeItem key={group.id} label={group.name} />) : <TreeItem label="Semua jenis kepegawaian terkait" />}
                </TreeItem>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-lg border bg-background p-4">
        <div className="mb-3 text-sm font-medium">Kelompok Profesi & Jabatan</div>
        {selectedProfessionGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum memilih kelompok profesi.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {selectedProfessionGroups.map((profession) => {
              const children = employeePositions.filter(
                (position) => position.professionGroupId === profession.id && (employeePositionIds.length === 0 || employeePositionIds.includes(position.id)),
              );

              return (
                <TreeItem key={profession.id} label={profession.name}>
                  {children.length > 0 ? children.map((position) => <TreeItem key={position.id} label={position.name} />) : <TreeItem label="Semua jabatan terkait" />}
                </TreeItem>
              );
            })}
          </ul>
        )}
      </div>

      {selectedRanks.length > 0 ? (
        <div className="rounded-lg border bg-background p-4">
          <div className="mb-3 text-sm font-medium">Pangkat/Golongan</div>
          <ul className="space-y-3 text-sm">{selectedRanks.map((rank) => <TreeItem key={rank.id} label={rank.name} />)}</ul>
        </div>
      ) : null}

      {selectedWorkplaces.length > 0 ? (
        <div className="rounded-lg border bg-background p-4">
          <div className="mb-3 text-sm font-medium">Unit Kerja</div>
          <ul className="space-y-3 text-sm">{selectedWorkplaces.map((workplace) => <TreeItem key={workplace.id} label={workplace.name} />)}</ul>
        </div>
      ) : null}
    </div>
  );
}

export function DocumentTypeFormPage({
  mode = "create",
  documentTypeId,
  initialData,
  employmentStatuses,
  employeeGroups,
  professionGroups,
  employeePositions,
  employeeRanks,
  workplaces,
}: DocumentTypeFormPageProps) {
  const {
    saving,
    isEditMode,
    code,
    setCode,
    archiveCategory,
    setArchiveCategory,
    name,
    setName,
    description,
    setDescription,
    allowedFormats,
    maxSizeValue,
    setMaxSizeValue,
    maxSizeUnit,
    setMaxSizeUnit,
    employmentStatusIds,
    employeeGroupIds,
    professionGroupIds,
    employeePositionIds,
    employeeRankIds,
    workplaceIds,
    validationState,
    filteredEmployeeGroups,
    filteredEmployeePositions,
    selectedTargetCount,
    handleEmploymentStatusToggle,
    handleEmployeeGroupToggle,
    handleProfessionGroupToggle,
    handleEmployeePositionToggle,
    handleEmployeeRankToggle,
    handleWorkplaceToggle,
    handleFormatToggle,
    setValidationState,
    handleSubmit,
  } = useDocumentTypeForm({
    mode,
    documentTypeId,
    initialData,
    employeeGroups,
    employeePositions,
  });

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Konfigurasi"
          title={isEditMode ? "Edit Jenis Dokumen" : "Tambah Jenis Dokumen"}
          description={
            isEditMode
              ? "Perbarui konfigurasi jenis dokumen pegawai, validasi, format berkas, dan target sasaran."
              : "Buat konfigurasi jenis dokumen pegawai, validasi, format berkas, dan target sasaran."
          }
          backHref={ROUTES.masterDataDocumentTypes}
          backLabel="Kembali ke jenis dokumen"
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Dasar Dokumen</CardTitle>
            <CardDescription>Kode, kategori, nama, dan keterangan jenis dokumen.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Kode Dokumen <span className="text-destructive">*</span></Label>
              <Input id="code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="KTP, STR, SIP" required />
              <p className="text-xs text-muted-foreground">Gunakan kode singkat uppercase, contoh: KTP.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="archiveCategory">Kategori Arsip <span className="text-destructive">*</span></Label>
              <Select value={archiveCategory} onValueChange={(value) => setArchiveCategory(value ?? "") }>
                <SelectTrigger id="archiveCategory" aria-label="Kategori arsip"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>{ARCHIVE_CATEGORY_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nama Jenis Dokumen <span className="text-destructive">*</span></Label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Surat Tanda Registrasi" required />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Deskripsi Keterangan</Label>
              <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Keterangan tambahan untuk admin atau pegawai." rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pengaturan Format dan Ukuran File</CardTitle>
            <CardDescription>Atur ekstensi yang diizinkan dan batas ukuran upload.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <Label>Format Ekstensi Diizinkan <span className="text-destructive">*</span></Label>
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {FORMAT_OPTIONS.map((option) => (
                  <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/40">
                    <Checkbox checked={allowedFormats.includes(option.value)} onCheckedChange={(checked) => handleFormatToggle(option.value, checked === true)} />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
              <div className="space-y-2">
                <Label htmlFor="maxSizeValue">Maksimal Ukuran File <span className="text-destructive">*</span></Label>
                <Input id="maxSizeValue" type="number" min="1" step="0.1" value={maxSizeValue} onChange={(event) => setMaxSizeValue(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSizeUnit">Satuan</Label>
                <Select value={maxSizeUnit} onValueChange={(value) => value && setMaxSizeUnit(value as "MB" | "KB")}>
                  <SelectTrigger id="maxSizeUnit" aria-label="Satuan ukuran file"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="MB">MB</SelectItem><SelectItem value="KB">KB</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Target Sasaran Pegawai</CardTitle>
            <CardDescription>Pilih sasaran khusus. Jika kosong, jenis dokumen berlaku untuk semua pegawai.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTargetCount === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-sm text-muted-foreground">Belum ada target dipilih. Jenis dokumen ini akan berlaku untuk semua pegawai.</div>
            ) : (
              <div className="flex flex-wrap gap-2"><Badge variant="secondary">{selectedTargetCount} target dipilih</Badge><Badge variant="outline">Preview struktur target</Badge></div>
            )}

            <Tabs defaultValue="employmentStatus" className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 group-data-horizontal/tabs:h-auto sm:flex sm:flex-wrap sm:justify-start">
                <TabsTrigger className="h-auto min-w-0 whitespace-normal px-2 py-2 text-center text-[11px] leading-tight sm:flex-1 sm:py-1 sm:text-sm" value="employmentStatus">Status Kepegawaian</TabsTrigger>
                <TabsTrigger className="h-auto min-w-0 whitespace-normal px-2 py-2 text-center text-[11px] leading-tight sm:flex-1 sm:py-1 sm:text-sm" value="employeeGroup">Jenis Kepegawaian</TabsTrigger>
                <TabsTrigger className="h-auto min-w-0 whitespace-normal px-2 py-2 text-center text-[11px] leading-tight sm:flex-1 sm:py-1 sm:text-sm" value="professionGroup">Kelompok Profesi</TabsTrigger>
                <TabsTrigger className="h-auto min-w-0 whitespace-normal px-2 py-2 text-center text-[11px] leading-tight sm:flex-1 sm:py-1 sm:text-sm" value="employeePosition">Jabatan</TabsTrigger>
                <TabsTrigger className="h-auto min-w-0 whitespace-normal px-2 py-2 text-center text-[11px] leading-tight sm:flex-1 sm:py-1 sm:text-sm" value="employeeRank">Pangkat/Golongan</TabsTrigger>
                <TabsTrigger className="h-auto min-w-0 whitespace-normal px-2 py-2 text-center text-[11px] leading-tight sm:flex-1 sm:py-1 sm:text-sm" value="workplace">Unit Kerja</TabsTrigger>
              </TabsList>
              <TabsContent value="employmentStatus" className="pt-3">
                <OptionChecklist options={employmentStatuses} selected={employmentStatusIds} onToggle={handleEmploymentStatusToggle} emptyText="Belum ada master status kepegawaian." />
              </TabsContent>
              <TabsContent value="employeeGroup" className="pt-3">
                <OptionChecklist options={filteredEmployeeGroups} selected={employeeGroupIds} onToggle={handleEmployeeGroupToggle} emptyText="Pilih status kepegawaian dulu agar jenis kepegawaian terkait tampil." />
              </TabsContent>
              <TabsContent value="professionGroup" className="pt-3">
                <OptionChecklist options={professionGroups} selected={professionGroupIds} onToggle={handleProfessionGroupToggle} emptyText="Belum ada master kelompok profesi." />
              </TabsContent>
              <TabsContent value="employeePosition" className="pt-3">
                <OptionChecklist options={filteredEmployeePositions} selected={employeePositionIds} onToggle={handleEmployeePositionToggle} emptyText="Pilih kelompok profesi dulu agar jabatan terkait tampil." />
              </TabsContent>
              <TabsContent value="employeeRank" className="pt-3">
                <OptionChecklist options={employeeRanks} selected={employeeRankIds} onToggle={handleEmployeeRankToggle} emptyText="Belum ada master pangkat/golongan." />
              </TabsContent>
              <TabsContent value="workplace" className="pt-3">
                <OptionChecklist options={workplaces} selected={workplaceIds} onToggle={handleWorkplaceToggle} emptyText="Belum ada master tempat tugas/unit kerja." />
              </TabsContent>
            </Tabs>

            <div className="rounded-lg border bg-muted/10 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium">Preview struktur target dokumen</div>
                  <p className="text-xs text-muted-foreground">Ringkasan hirarki target berdasarkan pilihan di atas.</p>
                </div>
                <Badge variant="secondary">Struktur target</Badge>
              </div>
              <div className="mt-3">
                <TargetTreePreview
                  employmentStatuses={employmentStatuses}
                  employeeGroups={employeeGroups}
                  professionGroups={professionGroups}
                  employeePositions={employeePositions}
                  employeeRanks={employeeRanks}
                  workplaces={workplaces}
                  employmentStatusIds={employmentStatusIds}
                  employeeGroupIds={employeeGroupIds}
                  professionGroupIds={professionGroupIds}
                  employeePositionIds={employeePositionIds}
                  employeeRankIds={employeeRankIds}
                  workplaceIds={workplaceIds}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Opsi Validasi Tambahan</CardTitle>
            <CardDescription>Atur field tambahan yang wajib dipenuhi saat pegawai mengunggah dokumen.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {VALIDATION_OPTIONS.map((option) => (
              <label key={option.key} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/40">
                <Checkbox checked={validationState[option.key]} onCheckedChange={(checked) => setValidationState(option.key, checked === true)} />
                <span className="space-y-1"><span className="block text-sm font-medium leading-5">{option.label}</span><span className="block text-xs text-muted-foreground">{option.description}</span></span>
              </label>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link href={ROUTES.masterDataDocumentTypes} className={buttonVariants({ variant: "outline" })}>Batal</Link>
          <Button type="submit" disabled={saving}>
            <span className="inline-flex size-4 items-center justify-center">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            </span>
            <span>{isEditMode ? "Simpan Perubahan" : "Simpan Dokumen"}</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
