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
};

/* -------------------------------------------------------------------------- */
/*  Constants                                                                   */
/* -------------------------------------------------------------------------- */

const GENDER_OPTIONS = [
  { value: "Laki-laki", label: "Laki-laki" },
  { value: "Perempuan", label: "Perempuan" },
] as const;

const ROLE_OPTIONS = [
  { value: "EMPLOYEE", label: ROLE_LABELS.EMPLOYEE },
  { value: "STAFF", label: ROLE_LABELS.STAFF },
  { value: "ADMIN", label: ROLE_LABELS.ADMIN },
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
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  /* ---- form state ---- */
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [nik, setNik] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [academicDegree, setAcademicDegree] = useState("");
  const [lastEducation, setLastEducation] = useState("");
  const [religion, setReligion] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [hasTmt, setHasTmt] = useState(false);
  const [tmtStartDate, setTmtStartDate] = useState("");
  const [tmtEndDate, setTmtEndDate] = useState("");
  const [role, setRole] = useState("EMPLOYEE");

  // Master data selects
  const [employmentStatusId, setEmploymentStatusId] = useState("");
  const [employeeGroupId, setEmployeeGroupId] = useState("");
  const [professionGroupId, setProfessionGroupId] = useState("");
  const [employeePositionId, setEmployeePositionId] = useState("");
  const [employeeRankId, setEmployeeRankId] = useState("");
  const [workplaceId, setWorkplaceId] = useState("");

  /* ---- filtered options ---- */

  const filteredGroups = useMemo(
    () =>
      employmentStatusId
        ? employeeGroups.filter((g) => g.employmentStatusId === employmentStatusId)
        : employeeGroups,
    [employmentStatusId, employeeGroups]
  );

  const filteredPositions = useMemo(
    () =>
      professionGroupId
        ? employeePositions.filter((p) => p.professionGroupId === professionGroupId)
        : employeePositions,
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

    // Basic validation
    if (!email.trim()) {
      toast.error("Email wajib diisi.");
      return;
    }
    if (!name.trim()) {
      toast.error("Nama wajib diisi.");
      return;
    }

    setSaving(true);

    const data: Record<string, unknown> = {
      email: email.trim(),
      name: name.trim(),
      employeeId: employeeId.trim() || null,
      nik: nik.trim() || null,
      gender: gender || null,
      birthPlace: birthPlace.trim() || null,
      birthDate: birthDate || null,
      academicDegree: academicDegree.trim() || null,
      lastEducation: lastEducation.trim() || null,
      religion: religion.trim() || null,
      maritalStatus: maritalStatus.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      joinDate: joinDate || null,
      hasTmt,
      tmtStartDate: hasTmt ? (tmtStartDate || null) : null,
      tmtEndDate: hasTmt ? (tmtEndDate || null) : null,
      role: role || "EMPLOYEE",
      employmentStatusId: employmentStatusId || null,
      employeeGroupId: employeeGroupId || null,
      employeePositionId: employeePositionId || null,
      employeeRankId: employeeRankId || null,
      workplaceId: workplaceId || null,
    };

    const result = await crudEmployeeAction("CREATE", undefined, data);

    setSaving(false);

    if (result.ok) {
      toast.success(`Pegawai "${name}" berhasil ditambahkan.`);
      router.push("/master-data/employees");
    } else {
      toast.error(result.error.message);
    }
  };

  /* ---- render ---- */

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Master Data"
          title="Tambah Pegawai"
          description={
            <>
              Isi data pegawai baru. Tanda{" "}
              <span className="text-destructive">*</span> wajib diisi.
            </>
          }
          backHref="/master-data/employees"
          backLabel="Kembali ke data pegawai"
        />

        {/* Data Akun */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Akun</CardTitle>
            <CardDescription>Informasi akun login pegawai.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
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
              <Select value={gender} onValueChange={(v) => v && setGender(v)}>
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
              <Input
                id="religion"
                placeholder="Islam, Kristen, dll"
                value={religion}
                onChange={(e) => setReligion(e.target.value)}
              />
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
              <Input
                id="maritalStatus"
                placeholder="Kawin, Belum Kawin, dll"
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
              />
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
              <Input
                id="lastEducation"
                placeholder="S1, D3, SMA, dll"
                value={lastEducation}
                onChange={(e) => setLastEducation(e.target.value)}
              />
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
                value={employmentStatusId}
                onValueChange={(v) => {
                  const val = v || "";
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
              <Select value={employeeGroupId} onValueChange={(v) => v && setEmployeeGroupId(v)}>
                <SelectTrigger id="employeeGroupId">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredGroups.length === 0 && (
                    <SelectItem value="__none" disabled>
                      {employmentStatusId
                        ? "Tidak ada kelompok"
                        : "Pilih status dulu"}
                    </SelectItem>
                  )}
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
                value={professionGroupId}
                onValueChange={(v) => {
                  const val = v || "";
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
              <Select value={employeePositionId} onValueChange={(v) => v && setEmployeePositionId(v)}>
                <SelectTrigger id="employeePositionId">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredPositions.length === 0 && (
                    <SelectItem value="__none" disabled>
                      {professionGroupId
                        ? "Tidak ada jabatan"
                        : "Pilih profesi dulu"}
                    </SelectItem>
                  )}
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
              <Select value={employeeRankId} onValueChange={(v) => v && setEmployeeRankId(v)}>
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
              <Select value={workplaceId} onValueChange={(v) => v && setWorkplaceId(v)}>
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
            href="/master-data/employees"
          >
            Batal
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Simpan
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
