"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

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
import { crudDocumentTypeAction } from "@/modules/document";
import { ARCHIVE_CATEGORY_OPTIONS } from "@/modules/document";

type MasterDataOption = { id: string; name: string };
type EmployeeGroupOption = MasterDataOption & { employmentStatusId: string | null };
type EmployeePositionOption = MasterDataOption & { professionGroupId: string | null };

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

type FormatOption = { value: string; label: string };
type ValidationOption = {
  key: "isMandatory" | "requiresExpiryDate" | "requiresIssueDate" | "requiresDocumentNumber" | "allowMultiple";
  label: string;
  description: string;
};

const FORMAT_OPTIONS: FormatOption[] = [
  { value: "pdf", label: "PDF" },
  { value: "jpg,jpeg", label: "JPG/JPEG" },
  { value: "png", label: "PNG" },
  { value: "docx", label: "DOCX" },
  { value: "xlsx", label: "XLSX" },
];

const VALIDATION_OPTIONS: ValidationOption[] = [
  { key: "isMandatory", label: "Dokumen Wajib Dimiliki", description: "Pegawai wajib memiliki jenis dokumen ini." },
  { key: "requiresExpiryDate", label: "Membutuhkan Tanggal Kedaluwarsa", description: "Form upload dokumen akan meminta tanggal kedaluwarsa." },
  { key: "requiresIssueDate", label: "Membutuhkan Tanggal Terbit", description: "Form upload dokumen akan meminta tanggal terbit." },
  { key: "requiresDocumentNumber", label: "Membutuhkan Nomor Surat", description: "Form upload dokumen akan meminta nomor surat/dokumen." },
  { key: "allowMultiple", label: "Boleh upload lebih dari satu berkas", description: "Pegawai dapat memiliki lebih dari satu berkas aktif untuk jenis ini." },
];

function toggleValue(values: string[], value: string, checked: boolean) {
  if (checked) return values.includes(value) ? values : [...values, value];
  return values.filter((item) => item !== value);
}

function parseAllowedFormats(value?: string | null) {
  const formats = new Set(
    (value || "pdf")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );

  const selected = FORMAT_OPTIONS.filter((option) =>
    option.value.split(",").some((format) => formats.has(format)),
  ).map((option) => option.value);

  return selected.length > 0 ? selected : ["pdf"];
}

function getInitialSize(maxSizeMb?: number | null) {
  const size = Number(maxSizeMb || 5);

  if (size > 0 && size < 1) {
    return {
      value: String(Number((size * 1024).toFixed(1))),
      unit: "KB" as const,
    };
  }

  return {
    value: String(size || 5),
    unit: "MB" as const,
  };
}

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
    <div className="grid gap-2 sm:grid-cols-2">
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
          <div className="mb-3 text-sm font-medium">Tempat Tugas/Unit Kerja</div>
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
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const isEditMode = mode === "edit";
  const initialSize = getInitialSize(initialData?.maxSizeMb);

  const [code, setCode] = useState(initialData?.code ?? "");
  const [archiveCategory, setArchiveCategory] = useState(initialData?.archiveCategory ?? "");
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [allowedFormats, setAllowedFormats] = useState<string[]>(parseAllowedFormats(initialData?.allowedFormats));
  const [maxSizeValue, setMaxSizeValue] = useState(initialSize.value);
  const [maxSizeUnit, setMaxSizeUnit] = useState<"MB" | "KB">(initialSize.unit);

  const [employmentStatusIds, setEmploymentStatusIds] = useState<string[]>(initialData?.employmentStatusIds ?? []);
  const [employeeGroupIds, setEmployeeGroupIds] = useState<string[]>(initialData?.employeeGroupIds ?? []);
  const [professionGroupIds, setProfessionGroupIds] = useState<string[]>(initialData?.professionGroupIds ?? []);
  const [employeePositionIds, setEmployeePositionIds] = useState<string[]>(initialData?.employeePositionIds ?? []);
  const [employeeRankIds, setEmployeeRankIds] = useState<string[]>(initialData?.employeeRankIds ?? []);
  const [workplaceIds, setWorkplaceIds] = useState<string[]>(initialData?.workplaceIds ?? []);

  const [isMandatory, setIsMandatory] = useState(initialData?.isMandatory ?? false);
  const [requiresExpiryDate, setRequiresExpiryDate] = useState(initialData?.requiresExpiryDate ?? false);
  const [requiresIssueDate, setRequiresIssueDate] = useState(initialData?.requiresIssueDate ?? false);
  const [requiresDocumentNumber, setRequiresDocumentNumber] = useState(initialData?.requiresDocumentNumber ?? false);
  const [allowMultiple, setAllowMultiple] = useState(initialData?.allowMultiple ?? false);

  const filteredEmployeeGroups = useMemo(
    () => employeeGroups.filter((group) => employmentStatusIds.length > 0 && group.employmentStatusId && employmentStatusIds.includes(group.employmentStatusId)),
    [employeeGroups, employmentStatusIds],
  );

  const filteredEmployeePositions = useMemo(
    () => employeePositions.filter((position) => professionGroupIds.length > 0 && position.professionGroupId && professionGroupIds.includes(position.professionGroupId)),
    [employeePositions, professionGroupIds],
  );

  const selectedTargetCount =
    employmentStatusIds.length + employeeGroupIds.length + professionGroupIds.length + employeePositionIds.length + employeeRankIds.length + workplaceIds.length;

  const validationState = { isMandatory, requiresExpiryDate, requiresIssueDate, requiresDocumentNumber, allowMultiple };

  const handleEmploymentStatusToggle = (id: string, checked: boolean) => {
    const nextStatusIds = toggleValue(employmentStatusIds, id, checked);
    setEmploymentStatusIds(nextStatusIds);
    setEmployeeGroupIds((current) => current.filter((groupId) => {
      const group = employeeGroups.find((item) => item.id === groupId);
      return group?.employmentStatusId ? nextStatusIds.includes(group.employmentStatusId) : false;
    }));
  };

  const handleProfessionGroupToggle = (id: string, checked: boolean) => {
    const nextProfessionIds = toggleValue(professionGroupIds, id, checked);
    setProfessionGroupIds(nextProfessionIds);
    setEmployeePositionIds((current) => current.filter((positionId) => {
      const position = employeePositions.find((item) => item.id === positionId);
      return position?.professionGroupId ? nextProfessionIds.includes(position.professionGroupId) : false;
    }));
  };

  const setValidationState = (key: ValidationOption["key"], checked: boolean) => {
    if (key === "isMandatory") setIsMandatory(checked);
    if (key === "requiresExpiryDate") setRequiresExpiryDate(checked);
    if (key === "requiresIssueDate") setRequiresIssueDate(checked);
    if (key === "requiresDocumentNumber") setRequiresDocumentNumber(checked);
    if (key === "allowMultiple") setAllowMultiple(checked);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    const parsedSize = Number(maxSizeValue);

    if (!trimmedCode) return toast.error("Kode dokumen wajib diisi.");
    if (!archiveCategory) return toast.error("Kategori arsip wajib dipilih.");
    if (!trimmedName) return toast.error("Nama jenis dokumen wajib diisi.");
    if (allowedFormats.length === 0) return toast.error("Pilih minimal satu format ekstensi.");
    if (!Number.isFinite(parsedSize) || parsedSize <= 0) return toast.error("Maksimal ukuran file wajib berupa angka positif.");

    const maxSizeMb = maxSizeUnit === "KB" ? parsedSize / 1024 : parsedSize;
    const operation = isEditMode ? "UPDATE" : "CREATE";
    const targetId = isEditMode ? documentTypeId ?? initialData?.id : undefined;

    if (isEditMode && !targetId) return toast.error("ID jenis dokumen tidak ditemukan.");

    setSaving(true);
    const result = await crudDocumentTypeAction(operation, targetId, {
      code: trimmedCode,
      archiveCategory,
      name: trimmedName,
      description: description.trim() || null,
      allowedFormats: allowedFormats.join(","),
      maxSizeMb,
      employmentStatusIds,
      employeeGroupIds,
      professionGroupIds,
      employeePositionIds,
      employeeRankIds,
      workplaceIds,
      isMandatory,
      requiresExpiryDate,
      requiresIssueDate,
      requiresDocumentNumber,
      allowMultiple,
    });
    setSaving(false);

    if (result.ok) {
      toast.success(`Jenis dokumen "${trimmedName}" berhasil ${isEditMode ? "diperbarui" : "ditambahkan"}.`);
      router.push(ROUTES.masterDataDocumentTypes);
      router.refresh();
      return;
    }

    toast.error(result.error.message || "Gagal menyimpan jenis dokumen.");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <PageHeader
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
                    <Checkbox checked={allowedFormats.includes(option.value)} onCheckedChange={(checked) => setAllowedFormats((current) => toggleValue(current, option.value, checked === true))} />
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
              <TabsList className="flex h-auto w-full flex-wrap justify-start">
                <TabsTrigger value="employmentStatus">Status Kepegawaian</TabsTrigger>
                <TabsTrigger value="employeeGroup">Jenis Kepegawaian</TabsTrigger>
                <TabsTrigger value="professionGroup">Kelompok Profesi</TabsTrigger>
                <TabsTrigger value="employeePosition">Jabatan</TabsTrigger>
                <TabsTrigger value="employeeRank">Pangkat/Golongan</TabsTrigger>
                <TabsTrigger value="workplace">Tempat Tugas/Unit Kerja</TabsTrigger>
              </TabsList>
              <TabsContent value="employmentStatus" className="pt-3">
                <OptionChecklist options={employmentStatuses} selected={employmentStatusIds} onToggle={handleEmploymentStatusToggle} emptyText="Belum ada master status kepegawaian." />
              </TabsContent>
              <TabsContent value="employeeGroup" className="pt-3">
                <OptionChecklist options={filteredEmployeeGroups} selected={employeeGroupIds} onToggle={(id, checked) => setEmployeeGroupIds((current) => toggleValue(current, id, checked))} emptyText="Pilih status kepegawaian dulu agar jenis kepegawaian terkait tampil." />
              </TabsContent>
              <TabsContent value="professionGroup" className="pt-3">
                <OptionChecklist options={professionGroups} selected={professionGroupIds} onToggle={handleProfessionGroupToggle} emptyText="Belum ada master kelompok profesi." />
              </TabsContent>
              <TabsContent value="employeePosition" className="pt-3">
                <OptionChecklist options={filteredEmployeePositions} selected={employeePositionIds} onToggle={(id, checked) => setEmployeePositionIds((current) => toggleValue(current, id, checked))} emptyText="Pilih kelompok profesi dulu agar jabatan terkait tampil." />
              </TabsContent>
              <TabsContent value="employeeRank" className="pt-3">
                <OptionChecklist options={employeeRanks} selected={employeeRankIds} onToggle={(id, checked) => setEmployeeRankIds((current) => toggleValue(current, id, checked))} emptyText="Belum ada master pangkat/golongan." />
              </TabsContent>
              <TabsContent value="workplace" className="pt-3">
                <OptionChecklist options={workplaces} selected={workplaceIds} onToggle={(id, checked) => setWorkplaceIds((current) => toggleValue(current, id, checked))} emptyText="Belum ada master tempat tugas/unit kerja." />
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
