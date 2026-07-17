"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { crudEmployeeAction } from "@/modules/employee/actions";
import {
  EDUCATION_OPTIONS,
  EMPLOYEE_STATUS_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  RELIGION_OPTIONS,
  mapEmployeeStatusLegacyToCanonical,
  mapGenderLegacyToCanonical,
  mapMaritalStatusLegacyToCanonical,
} from "@/modules/employee/constants";
import { ROLE_LABELS } from "@/constants/roles";

/* -------------------------------------------------------------------------- */
/*  Types                                                                       */
/* -------------------------------------------------------------------------- */

type MasterDataRecord = {
  id: string;
  name: string;
  employmentStatusId?: string;
  professionGroupId?: string;
};

type Props = {
  employmentStatuses: MasterDataRecord[];
  employeeGroups: (MasterDataRecord & { employmentStatusId: string })[];
  professionGroups: MasterDataRecord[];
  employeePositions: (MasterDataRecord & { professionGroupId: string })[];
  employeeRanks: MasterDataRecord[];
  workplaces: MasterDataRecord[];
  initialData?: EmployeeFormInitialData;
};

export type EmployeeFormInitialData = {
  id: string;
  email: string | null;
  employeeId: string | null;
  nik: string | null;
  name: string;
  gender: string | null;
  birthPlace: string | null;
  birthDate: string | null;
  academicDegree: string | null;
  lastEducation: string | null;
  religion: string | null;
  maritalStatus: string | null;
  status: string | null;
  phone: string | null;
  address: string | null;
  joinDate: string | null;
  tmtStartDate: string | null;
  tmtEndDate: string | null;
  role: string;
  isActive: boolean;
  employmentStatusId: string | null;
  employeeGroupId: string | null;
  professionGroupId: string | null;
  employeePositionId: string | null;
  employeeRankId: string | null;
  workplaceId: string | null;
};

type ActionError = {
  code: string;
  message: string;
  details?: Array<{ path: string; message: string }>;
};

/* -------------------------------------------------------------------------- */
/*  Constants                                                                   */
/* -------------------------------------------------------------------------- */

const ROLE_OPTIONS = [
  { value: "EMPLOYEE", label: ROLE_LABELS.EMPLOYEE },
  { value: "STAFF", label: ROLE_LABELS.STAFF },
  { value: "ADMIN", label: ROLE_LABELS.ADMIN },
] as const;

const ACCOUNT_STATUS_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toDateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function showFormError(title: string, messages: string[]) {
  toast.error(title, {
    description:
      messages.length > 0 ? (
        <div className="space-y-1">
          {messages.map((message) => (
            <div key={message}>{message}</div>
          ))}
        </div>
      ) : undefined,
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

/* -------------------------------------------------------------------------- */
/*  Form                                                                         */
/* -------------------------------------------------------------------------- */

export function MasterDataEmployeeForm({
  employmentStatuses,
  employeeGroups,
  professionGroups,
  employeePositions,
  employeeRanks,
  workplaces,
  initialData,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const isEditMode = Boolean(initialData);
  const employeeDetailHref = initialData ? `/master-data/employees/${initialData.id}` : "/master-data/employees";

  /* ---- form state ---- */
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [employeeId, setEmployeeId] = useState(initialData?.employeeId ?? "");
  const [nik, setNik] = useState(initialData?.nik ?? "");
  const [name, setName] = useState(initialData?.name ?? "");
  const [gender, setGender] = useState(mapGenderLegacyToCanonical(initialData?.gender) ?? "");
  const [birthPlace, setBirthPlace] = useState(initialData?.birthPlace ?? "");
  const [birthDate, setBirthDate] = useState(toDateInputValue(initialData?.birthDate));
  const [academicDegree, setAcademicDegree] = useState(initialData?.academicDegree ?? "");
  const [lastEducation, setLastEducation] = useState(initialData?.lastEducation ?? "");
  const [religion, setReligion] = useState(initialData?.religion ?? "");
  const [maritalStatus, setMaritalStatus] = useState(mapMaritalStatusLegacyToCanonical(initialData?.maritalStatus) ?? "");
  const [employeeStatus, setEmployeeStatus] = useState(mapEmployeeStatusLegacyToCanonical(initialData?.status) ?? "ACTIVE");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [joinDate, setJoinDate] = useState(toDateInputValue(initialData?.joinDate));
  const [hasTmt, setHasTmt] = useState(Boolean(initialData?.tmtStartDate || initialData?.tmtEndDate));
  const [tmtStartDate, setTmtStartDate] = useState(toDateInputValue(initialData?.tmtStartDate));
  const [tmtEndDate, setTmtEndDate] = useState(toDateInputValue(initialData?.tmtEndDate));
  const [role, setRole] = useState(initialData?.role ?? "EMPLOYEE");
  const [accountStatus, setAccountStatus] = useState(initialData?.isActive === false ? "inactive" : "active");

  // Master data selects
  const [employmentStatusId, setEmploymentStatusId] = useState(initialData?.employmentStatusId ?? "");
  const [employeeGroupId, setEmployeeGroupId] = useState(initialData?.employeeGroupId ?? "");
  const [professionGroupId, setProfessionGroupId] = useState(initialData?.professionGroupId ?? "");
  const [employeePositionId, setEmployeePositionId] = useState(initialData?.employeePositionId ?? "");
  const [employeeRankId, setEmployeeRankId] = useState(initialData?.employeeRankId ?? "");
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

  /* ---- helpers ---- */

  const handleResetGroup = (newStatusId: string) => {
    if (employeeGroupId) {
      const stillValid = employeeGroups.some(
        (g) => g.id === employeeGroupId && g.employmentStatusId === newStatusId
      );
      if (!stillValid) setEmployeeGroupId("");
    }
  };

  const handleResetPosition = (newProfessionId: string) => {
    if (employeePositionId) {
      const stillValid = employeePositions.some(
        (p) => p.id === employeePositionId && p.professionGroupId === newProfessionId
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
      validationErrors.push("NIP atau NIK wajib diisi. Isi minimal salah satu identitas pegawai.");
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
      tmtStartDate: hasTmt ? (tmtStartDate || null) : null,
      tmtEndDate: hasTmt ? (tmtEndDate || null) : null,
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
        toast.success(`Pegawai "${trimmedName}" berhasil ${isEditMode ? "diperbarui" : "ditambahkan"}.`);
        router.push(isEditMode && initialData ? `/master-data/employees/${initialData.id}` : "/master-data/employees");
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

  /* ---- render ---- */

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Master Data"
          title={isEditMode ? "Edit Pegawai" : "Tambah Pegawai"}
          description={
            isEditMode ? (
              "Perbarui data akun, identitas, status, dan penugasan pegawai."
            ) : (
              <>
                Isi data pegawai baru. Tanda{" "}
                <span className="text-destructive">*</span> wajib diisi.
              </>
            )
          }
          backHref={employeeDetailHref}
          backLabel={isEditMode ? "Kembali ke profil pegawai" : "Kembali ke data pegawai"}
        />

        {/* Data Akun */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Akun</CardTitle>
            <CardDescription>Informasi akun login pegawai.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="contoh@rsud.go.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeId">NIP</Label>
              <Input
                id="employeeId"
                placeholder="198501012010011001"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nik">NIK</Label>
              <Input
                id="nik"
                placeholder="7471010101010001"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                NIP atau NIK minimal salah satu wajib diisi.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(v) => v && setRole(v)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountStatus">Status Akun</Label>
              <Select value={accountStatus} onValueChange={(v) => v && setAccountStatus(v)}>
                <SelectTrigger id="accountStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Akun nonaktif tidak bisa login ke SIMDP.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeStatus">Status Pegawai</Label>
              <Select value={employeeStatus} onValueChange={(v) => v && setEmployeeStatus(v)}>
                <SelectTrigger id="employeeStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data Pribadi */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Pribadi</CardTitle>
            <CardDescription>Informasi identitas pegawai.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Nama lengkap pegawai"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Jenis Kelamin</Label>
              <Select value={gender || null} onValueChange={(v) => setGender(v ?? "")}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="religion">Agama</Label>
              <Select value={religion || null} onValueChange={(v) => setReligion(v ?? "")}>
                <SelectTrigger id="religion">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  {RELIGION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthPlace">Tempat Lahir</Label>
              <Input
                id="birthPlace"
                placeholder="Kota lahir"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Tanggal Lahir</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maritalStatus">Status Pernikahan</Label>
              <Select value={maritalStatus || null} onValueChange={(v) => setMaritalStatus(v ?? "")}>
                <SelectTrigger id="maritalStatus">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  {MARITAL_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicDegree">Gelar Akademik</Label>
              <Input
                id="academicDegree"
                placeholder="S.Kom, S.Sos, dll"
                value={academicDegree}
                onChange={(e) => setAcademicDegree(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastEducation">Pendidikan Terakhir</Label>
              <Select value={lastEducation || null} onValueChange={(v) => setLastEducation(v ?? "")}>
                <SelectTrigger id="lastEducation">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  {EDUCATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">No. Telepon</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="08123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Alamat</Label>
              <Textarea
                id="address"
                placeholder="Alamat lengkap pegawai"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Kepegawaian */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Kepegawaian</CardTitle>
            <CardDescription>
              Informasi status, jabatan, dan unit kerja pegawai.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employmentStatusId">Status Kepegawaian</Label>
              <Select
                value={employmentStatusId || null}
                onValueChange={(v) => {
                  const val = v ?? "";
                  setEmploymentStatusId(val);
                  handleResetGroup(val);
                }}
              >
                <SelectTrigger id="employmentStatusId">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  {employmentStatuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeGroupId">Kelompok Pegawai</Label>
              <Select
                value={employeeGroupId || null}
                onValueChange={(v) => setEmployeeGroupId(v ?? "")}
                disabled={!employmentStatusId || filteredGroups.length === 0}
              >
                <SelectTrigger id="employeeGroupId">
                  <SelectValue placeholder={!employmentStatusId ? "Pilih status kepegawaian dulu" : "Pilih..."} />
                </SelectTrigger>
                <SelectContent>
                  {filteredGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="professionGroupId">Rumpun Profesi</Label>
              <Select
                value={professionGroupId || null}
                onValueChange={(v) => {
                  const val = v ?? "";
                  setProfessionGroupId(val);
                  handleResetPosition(val);
                }}
              >
                <SelectTrigger id="professionGroupId">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  {professionGroups.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeePositionId">Jabatan</Label>
              <Select
                value={employeePositionId || null}
                onValueChange={(v) => setEmployeePositionId(v ?? "")}
                disabled={!professionGroupId || filteredPositions.length === 0}
              >
                <SelectTrigger id="employeePositionId">
                  <SelectValue placeholder={!professionGroupId ? "Pilih rumpun profesi dulu" : "Pilih..."} />
                </SelectTrigger>
                <SelectContent>
                  {filteredPositions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeRankId">Pangkat/Golongan</Label>
              <Select value={employeeRankId || null} onValueChange={(v) => setEmployeeRankId(v ?? "")}>
                <SelectTrigger id="employeeRankId">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  {employeeRanks.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workplaceId">Tempat Kerja</Label>
              <Select value={workplaceId || null} onValueChange={(v) => setWorkplaceId(v ?? "")}>
                <SelectTrigger id="workplaceId">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  {workplaces.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="joinDate">Tanggal Masuk</Label>
              <Input
                id="joinDate"
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* TMT */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">TMT</CardTitle>
            <CardDescription>
              Tanggal Mulai Tugas (TMT) — jika ada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasTmt"
                checked={hasTmt}
                onCheckedChange={(v) => setHasTmt(v === true)}
              />
              <Label htmlFor="hasTmt" className="text-sm font-normal">
                Punya data TMT
              </Label>
            </div>

            {hasTmt && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tmtStartDate">TMT Mulai</Label>
                  <Input
                    id="tmtStartDate"
                    type="date"
                    value={tmtStartDate}
                    onChange={(e) => setTmtStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tmtEndDate">TMT Selesai</Label>
                  <Input
                    id="tmtEndDate"
                    type="date"
                    value={tmtEndDate}
                    onChange={(e) => setTmtEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            className={buttonVariants({ variant: "outline" })}
            href={employeeDetailHref}
          >
            Batal
          </Link>
          <Button type="submit" disabled={saving}>
            <span className="inline-flex size-4 items-center justify-center">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            </span>
            <span>{saving ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Simpan"}</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
