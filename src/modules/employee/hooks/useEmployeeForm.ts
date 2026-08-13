"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { crudEmployeeAction } from "@/modules/employee";
import type { EmployeeFormInitialData } from "../components/MasterDataEmployeeForm";

export type MasterDataRecord = {
  id: string;
  name: string;
  employmentStatusId?: string;
  professionGroupId?: string;
};

type UseEmployeeFormProps = {
  employmentStatuses: MasterDataRecord[];
  employeeGroups: (MasterDataRecord & { employmentStatusId: string })[];
  professionGroups: MasterDataRecord[];
  employeePositions: (MasterDataRecord & { professionGroupId: string })[];
  employeeRanks: MasterDataRecord[];
  workplaces: MasterDataRecord[];
  initialData?: EmployeeFormInitialData;
};

type ActionError = {
  code: string;
  message: string;
  details?: Array<{ path: string; message: string }>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toDateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function showFormError(title: string, messages: string[]) {
  toast.error(title, {
    description: messages.join("\n"),
  });
}

function getActionErrorMessages(error: ActionError) {
  if (error.details?.length) {
    return error.details.map((detail) => detail.message);
  }

  if (error.code === "UNAUTHENTICATED") {
    return ["Sesi login berakhir. Silakan login ulang lalu coba lagi."];
  }

  if (error.code === "FORBIDDEN") {
    return ["Akun Anda tidak memiliki akses untuk menyimpan data pegawai."];
  }

  return [error.message || "Terjadi kesalahan saat menyimpan data pegawai."];
}

export function useEmployeeForm({
  employeeGroups,
  employeePositions,
  initialData,
}: UseEmployeeFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const isEditMode = Boolean(initialData);
  const employeeDetailHref = initialData
    ? `/master-data/employees/${initialData.id}`
    : "/master-data/employees";

  /* ---- form state ---- */
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [employeeId, setEmployeeId] = useState(initialData?.employeeId ?? "");
  const [nik, setNik] = useState(initialData?.nik ?? "");
  const [name, setName] = useState(initialData?.name ?? "");
  const [gender, setGender] = useState(initialData?.gender ?? "");
  const [birthPlace, setBirthPlace] = useState(initialData?.birthPlace ?? "");
  const [birthDate, setBirthDate] = useState(
    toDateInputValue(initialData?.birthDate)
  );
  const [academicDegree, setAcademicDegree] = useState(
    initialData?.academicDegree ?? ""
  );
  const [lastEducation, setLastEducation] = useState(
    initialData?.lastEducation ?? ""
  );
  const [religion, setReligion] = useState(initialData?.religion ?? "");
  const [maritalStatus, setMaritalStatus] = useState(initialData?.maritalStatus ?? "");
  const [employeeStatus, setEmployeeStatus] = useState(initialData?.status ?? "ACTIVE");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [joinDate, setJoinDate] = useState(
    toDateInputValue(initialData?.joinDate)
  );
  const [hasTmt, setHasTmt] = useState(
    Boolean(initialData?.tmtStartDate || initialData?.tmtEndDate)
  );
  const [tmtStartDate, setTmtStartDate] = useState(
    toDateInputValue(initialData?.tmtStartDate)
  );
  const [tmtEndDate, setTmtEndDate] = useState(
    toDateInputValue(initialData?.tmtEndDate)
  );
  const [role, setRole] = useState(initialData?.role ?? "EMPLOYEE");
  const [accountStatus, setAccountStatus] = useState(
    initialData?.isActive === false ? "inactive" : "active"
  );

  // Master data selects
  const [employmentStatusId, setEmploymentStatusId] = useState(
    initialData?.employmentStatusId ?? ""
  );
  const [employeeGroupId, setEmployeeGroupId] = useState(
    initialData?.employeeGroupId ?? ""
  );
  const [professionGroupId, setProfessionGroupId] = useState(
    initialData?.professionGroupId ?? ""
  );
  const [employeePositionId, setEmployeePositionId] = useState(
    initialData?.employeePositionId ?? ""
  );
  const [employeeRankId, setEmployeeRankId] = useState(
    initialData?.employeeRankId ?? ""
  );
  const [workplaceId, setWorkplaceId] = useState(initialData?.workplaceId ?? "");

  /* ---- filtered options ---- */

  const filteredGroups = useMemo(
    () =>
      employmentStatusId
        ? employeeGroups.filter((g) => g.employmentStatusId === employmentStatusId)
        : [],
    [employmentStatusId, employeeGroups]
  );

  const filteredPositions = useMemo(
    () =>
      professionGroupId
        ? employeePositions.filter((p) => p.professionGroupId === professionGroupId)
        : [],
    [professionGroupId, employeePositions]
  );

  /* ---- handlers ---- */

  const handleEmploymentStatusChange = (val: string) => {
    setEmploymentStatusId(val);
    if (employeeGroupId) {
      const stillValid = employeeGroups.some(
        (g) => g.id === employeeGroupId && g.employmentStatusId === val
      );
      if (!stillValid) setEmployeeGroupId("");
    }
  };

  const handleProfessionGroupChange = (val: string) => {
    setProfessionGroupId(val);
    if (employeePositionId) {
      const stillValid = employeePositions.some(
        (p) => p.id === employeePositionId && p.professionGroupId === val
      );
      if (!stillValid) setEmployeePositionId("");
    }
  };

  /* ---- submit ---- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: string[] = [];
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    const trimmedEmployeeId = employeeId.trim();
    const trimmedNik = nik.trim();

    if (!trimmedEmail) {
      validationErrors.push("Email wajib diisi.");
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      validationErrors.push("Format email tidak valid.");
    }
    if (!trimmedName) {
      validationErrors.push("Nama lengkap wajib diisi.");
    }
    if (!trimmedEmployeeId && !trimmedNik) {
      validationErrors.push(
        "NIP atau NIK wajib diisi. Isi minimal salah satu identitas pegawai."
      );
    }
    if (hasTmt && !tmtStartDate) {
      validationErrors.push("TMT mulai wajib diisi jika data TMT diaktifkan.");
    }
    if (hasTmt && tmtStartDate && tmtEndDate && tmtEndDate < tmtStartDate) {
      validationErrors.push("TMT selesai tidak boleh lebih awal dari TMT mulai.");
    }

    if (validationErrors.length > 0) {
      showFormError("Data pegawai belum lengkap", validationErrors);
      return;
    }

    setSaving(true);

    const data: Record<string, unknown> = {
      email: trimmedEmail,
      name: trimmedName,
      employeeId: trimmedEmployeeId || null,
      nik: trimmedNik || null,
      gender: gender || null,
      birthPlace: birthPlace.trim() || null,
      birthDate: birthDate || null,
      academicDegree: academicDegree.trim() || null,
      lastEducation: lastEducation.trim() || null,
      religion: religion.trim() || null,
      maritalStatus: maritalStatus.trim() || null,
      status: employeeStatus,
      phone: phone.trim() || null,
      address: address.trim() || null,
      joinDate: joinDate || null,
      hasTmt,
      tmtStartDate: hasTmt ? tmtStartDate || null : null,
      tmtEndDate: hasTmt ? tmtEndDate || null : null,
      role: role || "EMPLOYEE",
      isActive: accountStatus === "active",
      employmentStatusId: employmentStatusId || null,
      employeeGroupId: employeeGroupId || null,
      employeePositionId: employeePositionId || null,
      employeeRankId: employeeRankId || null,
      workplaceId: workplaceId || null,
    };

    try {
      const result = await crudEmployeeAction(
        isEditMode ? "UPDATE" : "CREATE",
        initialData?.id,
        data
      );

      if (result.ok) {
        toast.success(
          `Pegawai "${trimmedName}" berhasil ${
            isEditMode ? "diperbarui" : "ditambahkan"
          }.`
        );
        router.push(
          isEditMode && initialData
            ? `/master-data/employees/${initialData.id}`
            : "/master-data/employees"
        );
      } else {
        showFormError("Gagal menyimpan pegawai", getActionErrorMessages(result.error));
      }
    } catch (error) {
      showFormError("Gagal menyimpan pegawai", [
        error instanceof Error ? error.message : "Terjadi kesalahan tak terduga.",
      ]);
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    isEditMode,
    employeeDetailHref,
    // state
    email,
    setEmail,
    employeeId,
    setEmployeeId,
    nik,
    setNik,
    name,
    setName,
    gender,
    setGender,
    birthPlace,
    setBirthPlace,
    birthDate,
    setBirthDate,
    academicDegree,
    setAcademicDegree,
    lastEducation,
    setLastEducation,
    religion,
    setReligion,
    maritalStatus,
    setMaritalStatus,
    employeeStatus,
    setEmployeeStatus,
    phone,
    setPhone,
    address,
    setAddress,
    joinDate,
    setJoinDate,
    hasTmt,
    setHasTmt,
    tmtStartDate,
    setTmtStartDate,
    tmtEndDate,
    setTmtEndDate,
    role,
    setRole,
    accountStatus,
    setAccountStatus,
    employmentStatusId,
    employeeGroupId,
    setEmployeeGroupId,
    professionGroupId,
    employeePositionId,
    setEmployeePositionId,
    employeeRankId,
    setEmployeeRankId,
    workplaceId,
    setWorkplaceId,
    // computed & handlers
    filteredGroups,
    filteredPositions,
    handleEmploymentStatusChange,
    handleProfessionGroupChange,
    handleSubmit,
  };
}
