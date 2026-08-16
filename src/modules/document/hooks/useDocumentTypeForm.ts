"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROUTES } from "@/constants";
import { crudDocumentTypeAction } from "@/modules/document";
import type { DocumentTypeFormInitialData } from "../components/DocumentTypeFormPage";

export type MasterDataOption = { id: string; name: string };
export type EmployeeGroupOption = MasterDataOption & {
  employmentStatusId: string | null;
};
export type EmployeePositionOption = MasterDataOption & {
  professionGroupId: string | null;
};

export type FormatOption = { value: string; label: string };
export type ValidationOption = {
  key:
    | "isMandatory"
    | "requiresExpiryDate"
    | "requiresIssueDate"
    | "requiresDocumentNumber"
    | "allowMultiple";
  label: string;
  description: string;
};

export const FORMAT_OPTIONS: FormatOption[] = [
  { value: "pdf", label: "PDF" },
  { value: "jpg,jpeg", label: "JPG/JPEG" },
  { value: "png", label: "PNG" },
  { value: "docx", label: "DOCX" },
  { value: "xlsx", label: "XLSX" },
];

export const VALIDATION_OPTIONS: ValidationOption[] = [
  {
    key: "isMandatory",
    label: "Dokumen Wajib Dimiliki",
    description: "Pegawai wajib memiliki jenis dokumen ini.",
  },
  {
    key: "requiresExpiryDate",
    label: "Membutuhkan Tanggal Kedaluwarsa",
    description: "Form upload dokumen akan meminta tanggal kedaluwarsa.",
  },
  {
    key: "requiresIssueDate",
    label: "Membutuhkan Tanggal Terbit",
    description: "Form upload dokumen akan meminta tanggal terbit.",
  },
  {
    key: "requiresDocumentNumber",
    label: "Membutuhkan Nomor Surat",
    description: "Form upload dokumen akan meminta nomor surat/dokumen.",
  },
  {
    key: "allowMultiple",
    label: "Boleh upload lebih dari satu berkas",
    description:
      "Pegawai dapat memiliki lebih dari satu berkas aktif untuk jenis ini.",
  },
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
      .filter(Boolean)
  );

  const selected = FORMAT_OPTIONS.filter((option) =>
    option.value.split(",").some((format) => formats.has(format))
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

type UseDocumentTypeFormProps = {
  mode?: "create" | "edit";
  documentTypeId?: string;
  initialData?: DocumentTypeFormInitialData;
  employeeGroups: EmployeeGroupOption[];
  employeePositions: EmployeePositionOption[];
};

export function useDocumentTypeForm({
  mode = "create",
  documentTypeId,
  initialData,
  employeeGroups,
  employeePositions,
}: UseDocumentTypeFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const isEditMode = mode === "edit";
  const initialSize = getInitialSize(initialData?.maxSizeMb);

  const [code, setCode] = useState(initialData?.code ?? "");
  const [archiveCategory, setArchiveCategory] = useState(
    initialData?.archiveCategory ?? ""
  );
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [allowedFormats, setAllowedFormats] = useState<string[]>(
    parseAllowedFormats(initialData?.allowedFormats)
  );
  const [maxSizeValue, setMaxSizeValue] = useState(initialSize.value);
  const [maxSizeUnit, setMaxSizeUnit] = useState<"MB" | "KB">(initialSize.unit);

  const [employmentStatusIds, setEmploymentStatusIds] = useState<string[]>(
    initialData?.employmentStatusIds ?? []
  );
  const [employeeGroupIds, setEmployeeGroupIds] = useState<string[]>(
    initialData?.employeeGroupIds ?? []
  );
  const [professionGroupIds, setProfessionGroupIds] = useState<string[]>(
    initialData?.professionGroupIds ?? []
  );
  const [employeePositionIds, setEmployeePositionIds] = useState<string[]>(
    initialData?.employeePositionIds ?? []
  );
  const [employeeRankIds, setEmployeeRankIds] = useState<string[]>(
    initialData?.employeeRankIds ?? []
  );
  const [workplaceIds, setWorkplaceIds] = useState<string[]>(
    initialData?.workplaceIds ?? []
  );

  const [isMandatory, setIsMandatory] = useState(
    initialData?.isMandatory ?? false
  );
  const [requiresExpiryDate, setRequiresExpiryDate] = useState(
    initialData?.requiresExpiryDate ?? false
  );
  const [requiresIssueDate, setRequiresIssueDate] = useState(
    initialData?.requiresIssueDate ?? false
  );
  const [requiresDocumentNumber, setRequiresDocumentNumber] = useState(
    initialData?.requiresDocumentNumber ?? false
  );
  const [allowMultiple, setAllowMultiple] = useState(
    initialData?.allowMultiple ?? false
  );

  const filteredEmployeeGroups = useMemo(
    () =>
      employeeGroups.filter(
        (group) =>
          employmentStatusIds.length > 0 &&
          group.employmentStatusId &&
          employmentStatusIds.includes(group.employmentStatusId)
      ),
    [employeeGroups, employmentStatusIds]
  );

  const filteredEmployeePositions = useMemo(
    () =>
      employeePositions.filter(
        (position) =>
          professionGroupIds.length > 0 &&
          position.professionGroupId &&
          professionGroupIds.includes(position.professionGroupId)
      ),
    [employeePositions, professionGroupIds]
  );

  const selectedTargetCount =
    employmentStatusIds.length +
    employeeGroupIds.length +
    professionGroupIds.length +
    employeePositionIds.length +
    employeeRankIds.length +
    workplaceIds.length;

  const validationState = {
    isMandatory,
    requiresExpiryDate,
    requiresIssueDate,
    requiresDocumentNumber,
    allowMultiple,
  };

  const handleEmploymentStatusToggle = (id: string, checked: boolean) => {
    const nextStatusIds = toggleValue(employmentStatusIds, id, checked);
    setEmploymentStatusIds(nextStatusIds);
    setEmployeeGroupIds((current) =>
      current.filter((groupId) => {
        const group = employeeGroups.find((item) => item.id === groupId);
        return group?.employmentStatusId
          ? nextStatusIds.includes(group.employmentStatusId)
          : false;
      })
    );
  };

  const handleEmployeeGroupToggle = (id: string, checked: boolean) => {
    setEmployeeGroupIds((current) => toggleValue(current, id, checked));
  };

  const handleProfessionGroupToggle = (id: string, checked: boolean) => {
    const nextProfessionIds = toggleValue(professionGroupIds, id, checked);
    setProfessionGroupIds(nextProfessionIds);
    setEmployeePositionIds((current) =>
      current.filter((positionId) => {
        const position = employeePositions.find(
          (item) => item.id === positionId
        );
        return position?.professionGroupId
          ? nextProfessionIds.includes(position.professionGroupId)
          : false;
      })
    );
  };

  const handleEmployeePositionToggle = (id: string, checked: boolean) => {
    setEmployeePositionIds((current) => toggleValue(current, id, checked));
  };

  const handleEmployeeRankToggle = (id: string, checked: boolean) => {
    setEmployeeRankIds((current) => toggleValue(current, id, checked));
  };

  const handleWorkplaceToggle = (id: string, checked: boolean) => {
    setWorkplaceIds((current) => toggleValue(current, id, checked));
  };

  const handleFormatToggle = (formatValue: string, checked: boolean) => {
    setAllowedFormats((current) => toggleValue(current, formatValue, checked));
  };

  const setValidationState = (
    key: ValidationOption["key"],
    checked: boolean
  ) => {
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
    if (allowedFormats.length === 0)
      return toast.error("Pilih minimal satu format ekstensi.");
    if (!Number.isFinite(parsedSize) || parsedSize <= 0)
      return toast.error("Maksimal ukuran file wajib berupa angka positif.");

    const maxSizeMb = maxSizeUnit === "KB" ? parsedSize / 1024 : parsedSize;
    const operation = isEditMode ? "UPDATE" : "CREATE";
    const targetId = isEditMode
      ? documentTypeId ?? initialData?.id
      : undefined;

    if (isEditMode && !targetId)
      return toast.error("ID jenis dokumen tidak ditemukan.");

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
      toast.success(
        `Jenis dokumen "${trimmedName}" berhasil ${
          isEditMode ? "diperbarui" : "ditambahkan"
        }.`
      );
      router.push(ROUTES.masterDataDocumentTypes);
      router.refresh();
      return;
    }

    toast.error(result.error.message || "Gagal menyimpan jenis dokumen.");
  };

  return {
    saving,
    isEditMode,
    // state
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
    // computed & options
    filteredEmployeeGroups,
    filteredEmployeePositions,
    selectedTargetCount,
    // handlers
    handleEmploymentStatusToggle,
    handleEmployeeGroupToggle,
    handleProfessionGroupToggle,
    handleEmployeePositionToggle,
    handleEmployeeRankToggle,
    handleWorkplaceToggle,
    handleFormatToggle,
    setValidationState,
    handleSubmit,
  };
}
