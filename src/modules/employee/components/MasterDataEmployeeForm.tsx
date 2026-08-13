"use client";

import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { PageHeader } from "@/components/navigation/PageHeader";
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
import {
  EDUCATION_OPTIONS,
  EMPLOYEE_STATUS_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  RELIGION_OPTIONS,
} from "@/modules/employee";
import { ROLE_LABELS } from "@/constants/roles";
import { useEmployeeForm, type MasterDataRecord } from "../hooks/useEmployeeForm";

/* -------------------------------------------------------------------------- */
/*  Types                                                                       */
/* -------------------------------------------------------------------------- */

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
  const {
    saving,
    isEditMode,
    employeeDetailHref,
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
    filteredGroups,
    filteredPositions,
    handleEmploymentStatusChange,
    handleProfessionGroupChange,
    handleSubmit,
  } = useEmployeeForm({
    employmentStatuses,
    employeeGroups,
    professionGroups,
    employeePositions,
    employeeRanks,
    workplaces,
    initialData,
  });

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
                Akun nonaktif tidak bisa login ke SiCantIK.
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
                onValueChange={(v) => handleEmploymentStatusChange(v ?? "")}
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
                onValueChange={(v) => handleProfessionGroupChange(v ?? "")}
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
            <div className="flex items-center gap-2" suppressHydrationWarning>
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
