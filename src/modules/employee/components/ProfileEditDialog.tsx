"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Briefcase, Loader2, Pencil, Save, User } from "lucide-react";
import { toast } from "sonner";

import { CardContainer } from "@/components/cards/CardContainer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { updateProfileAction } from "@/modules/employee";
import {
  EDUCATION_OPTIONS,
  EMPLOYEE_STATUS_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  RELIGION_OPTIONS,
} from "@/modules/employee";

export type ProfileMasterDataOption = {
  id: string;
  name: string;
  employmentStatusId?: string | null;
  professionGroupId?: string | null;
};

export type EditableProfileData = {
  name: string;
  gender: string;
  birthPlace: string;
  birthDate: string;
  academicDegree: string;
  lastEducation: string;
  religion: string;
  maritalStatus: string;
  status: string;
  phone: string;
  address: string;
  joinDate: string;
  hasTmt: boolean;
  tmtStartDate: string;
  tmtEndDate: string;
  employmentStatusId: string;
  employeeGroupId: string;
  professionGroupId: string;
  employeePositionId: string;
  employeeRankId: string;
  workplaceId: string;
};

type ProfileEditDialogProps = {
  initialData: EditableProfileData;
  cooldownUntil: string | null;
  employmentStatuses: ProfileMasterDataOption[];
  employeeGroups: ProfileMasterDataOption[];
  professionGroups: ProfileMasterDataOption[];
  employeePositions: ProfileMasterDataOption[];
  employeeRanks: ProfileMasterDataOption[];
  workplaces: ProfileMasterDataOption[];
};

function nullableValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function getErrorMessages(error: { message: string; details?: Array<{ message: string }> }) {
  if (error.details?.length) {
    return error.details.map((detail) => detail.message).join("\n");
  }
  return error.message;
}

export function ProfileEditDialog({
  initialData,
  cooldownUntil,
  employmentStatuses,
  employeeGroups,
  professionGroups,
  employeePositions,
  employeeRanks,
  workplaces,
}: ProfileEditDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(initialData);
  const isCooldownActive = Boolean(cooldownUntil);

  const filteredGroups = useMemo(
    () => employeeGroups.filter((group) => group.employmentStatusId === form.employmentStatusId),
    [employeeGroups, form.employmentStatusId],
  );
  const filteredPositions = useMemo(
    () => employeePositions.filter((position) => position.professionGroupId === form.professionGroupId),
    [employeePositions, form.professionGroupId],
  );

  const updateField = <Field extends keyof EditableProfileData>(field: Field, value: EditableProfileData[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleEmploymentStatusChange = (value: string) => {
    setForm((current) => ({
      ...current,
      employmentStatusId: value,
      employeeGroupId: employeeGroups.some((group) => group.id === current.employeeGroupId && group.employmentStatusId === value)
        ? current.employeeGroupId
        : "",
    }));
  };

  const handleProfessionGroupChange = (value: string) => {
    setForm((current) => ({
      ...current,
      professionGroupId: value,
      employeePositionId: employeePositions.some((position) => position.id === current.employeePositionId && position.professionGroupId === value)
        ? current.employeePositionId
        : "",
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Nama lengkap wajib diisi.");
      return;
    }
    if (form.hasTmt && !form.tmtStartDate) {
      toast.error("TMT mulai wajib diisi jika data TMT diaktifkan.");
      return;
    }
    if (form.hasTmt && form.tmtStartDate && form.tmtEndDate && form.tmtEndDate < form.tmtStartDate) {
      toast.error("TMT selesai tidak boleh lebih awal dari TMT mulai.");
      return;
    }

    startTransition(async () => {
      const result = await updateProfileAction({
        name: form.name.trim(),
        gender: nullableValue(form.gender),
        birthPlace: nullableValue(form.birthPlace),
        birthDate: form.birthDate || null,
        academicDegree: nullableValue(form.academicDegree),
        lastEducation: nullableValue(form.lastEducation),
        religion: nullableValue(form.religion),
        maritalStatus: nullableValue(form.maritalStatus),
        status: form.status || "ACTIVE",
        phone: nullableValue(form.phone),
        address: nullableValue(form.address),
        joinDate: form.joinDate || null,
        hasTmt: form.hasTmt,
        tmtStartDate: form.hasTmt ? form.tmtStartDate || null : null,
        tmtEndDate: form.hasTmt ? form.tmtEndDate || null : null,
        employmentStatusId: form.employmentStatusId || null,
        employeeGroupId: form.employeeGroupId || null,
        professionGroupId: form.professionGroupId || null,
        employeePositionId: form.employeePositionId || null,
        employeeRankId: form.employeeRankId || null,
        workplaceId: form.workplaceId || null,
      });

      if (result.ok) {
        toast.success("Profil berhasil diperbarui. Perubahan mandiri berikutnya tersedia setelah 90 hari.");
        setOpen(false);
        router.refresh();
        return;
      }

      toast.error(getErrorMessages(result.error));
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="default"
            aria-label="Edit Profil"
            className="size-10 p-0 sm:size-auto sm:h-8 sm:px-2.5"
            title={cooldownUntil ? `Profil mandiri bisa diedit kembali pada ${cooldownUntil}` : undefined}
          />
        }
      >
        <Pencil className="size-3.5" />
        <span className="hidden sm:inline">Edit Profil</span>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Ubah Profil Saya</DialogTitle>
            <DialogDescription>
              Lengkapi data pribadi dan data kerja secara mandiri. Setelah disimpan, perubahan berikutnya tersedia 90 hari kemudian.
            </DialogDescription>
          </DialogHeader>

          {cooldownUntil ? (
            <Alert className="border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="size-4" />
              <AlertDescription className="text-amber-900 dark:text-amber-200">
                Profil mandiri bisa diedit kembali pada {cooldownUntil}.
              </AlertDescription>
            </Alert>
          ) : null}

          <CardContainer
            title="Data Pribadi"
            description="Identitas dan kontak yang bisa dilengkapi mandiri."
            icon={<User className="size-4 shrink-0 text-primary" />}
            contentClassName="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="profile-name">Nama Lengkap</Label>
              <Input id="profile-name" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-gender">Jenis Kelamin</Label>
              <Select value={form.gender || null} onValueChange={(value) => updateField("gender", value ?? "")}>
                <SelectTrigger id="profile-gender">
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-birth-place">Tempat Lahir</Label>
              <Input id="profile-birth-place" placeholder="Kota lahir" value={form.birthPlace} onChange={(event) => updateField("birthPlace", event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-birth-date">Tanggal Lahir</Label>
              <Input id="profile-birth-date" type="date" value={form.birthDate} onChange={(event) => updateField("birthDate", event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-religion">Agama</Label>
              <Select value={form.religion || null} onValueChange={(value) => updateField("religion", value ?? "")}>
                <SelectTrigger id="profile-religion">
                  <SelectValue placeholder="Pilih agama" />
                </SelectTrigger>
                <SelectContent>
                  {RELIGION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-marital-status">Status Pernikahan</Label>
              <Select value={form.maritalStatus || null} onValueChange={(value) => updateField("maritalStatus", value ?? "")}>
                <SelectTrigger id="profile-marital-status">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {MARITAL_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-last-education">Pendidikan Terakhir</Label>
              <Select value={form.lastEducation || null} onValueChange={(value) => updateField("lastEducation", value ?? "")}>
                <SelectTrigger id="profile-last-education">
                  <SelectValue placeholder="Pilih pendidikan" />
                </SelectTrigger>
                <SelectContent>
                  {EDUCATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-academic-degree">Gelar Akademik</Label>
              <Input id="profile-academic-degree" placeholder="S.Kep., Ns. / dr., Sp.A" value={form.academicDegree} onChange={(event) => updateField("academicDegree", event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-phone">No. Telepon</Label>
              <Input id="profile-phone" type="tel" placeholder="08123456789" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="profile-address">Alamat Tinggal</Label>
              <Textarea id="profile-address" placeholder="Alamat lengkap" rows={3} value={form.address} onChange={(event) => updateField("address", event.target.value)} />
            </div>
          </CardContainer>

          <CardContainer
            title="Data Kerja"
            description="Status dan penempatan kerja yang bisa dilengkapi mandiri."
            icon={<Briefcase className="size-4 shrink-0 text-primary" />}
            contentClassName="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="profile-status">Status Pegawai</Label>
              <Select value={form.status || "ACTIVE"} onValueChange={(value) => updateField("status", value ?? "ACTIVE")}>
                <SelectTrigger id="profile-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-join-date">Tanggal Masuk</Label>
              <Input id="profile-join-date" type="date" value={form.joinDate} onChange={(event) => updateField("joinDate", event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-employment-status">Status Kepegawaian</Label>
              <Select value={form.employmentStatusId || null} onValueChange={(value) => handleEmploymentStatusChange(value ?? "")}>
                <SelectTrigger id="profile-employment-status">
                  <SelectValue placeholder="Pilih status kepegawaian" />
                </SelectTrigger>
                <SelectContent>
                  {employmentStatuses.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-employee-group">Kelompok Pegawai</Label>
              <Select
                value={form.employeeGroupId || null}
                onValueChange={(value) => updateField("employeeGroupId", value ?? "")}
                disabled={!form.employmentStatusId || filteredGroups.length === 0}
              >
                <SelectTrigger id="profile-employee-group">
                  <SelectValue placeholder={!form.employmentStatusId ? "Pilih status dulu" : "Pilih kelompok"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredGroups.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-profession-group">Rumpun Profesi</Label>
              <Select value={form.professionGroupId || null} onValueChange={(value) => handleProfessionGroupChange(value ?? "")}>
                <SelectTrigger id="profile-profession-group">
                  <SelectValue placeholder="Pilih rumpun profesi" />
                </SelectTrigger>
                <SelectContent>
                  {professionGroups.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-position">Jabatan</Label>
              <Select
                value={form.employeePositionId || null}
                onValueChange={(value) => updateField("employeePositionId", value ?? "")}
                disabled={!form.professionGroupId || filteredPositions.length === 0}
              >
                <SelectTrigger id="profile-position">
                  <SelectValue placeholder={!form.professionGroupId ? "Pilih rumpun dulu" : "Pilih jabatan"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredPositions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-rank">Pangkat/Golongan</Label>
              <Select value={form.employeeRankId || null} onValueChange={(value) => updateField("employeeRankId", value ?? "")}>
                <SelectTrigger id="profile-rank">
                  <SelectValue placeholder="Pilih pangkat/golongan" />
                </SelectTrigger>
                <SelectContent>
                  {employeeRanks.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-workplace">Tempat Kerja</Label>
              <Select value={form.workplaceId || null} onValueChange={(value) => updateField("workplaceId", value ?? "")}>
                <SelectTrigger id="profile-workplace">
                  <SelectValue placeholder="Pilih tempat kerja" />
                </SelectTrigger>
                <SelectContent>
                  {workplaces.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <Checkbox id="profile-has-tmt" checked={form.hasTmt} onCheckedChange={(value) => updateField("hasTmt", value === true)} />
              <Label htmlFor="profile-has-tmt" className="text-sm font-normal">
                Punya data TMT
              </Label>
            </div>

            {form.hasTmt ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="profile-tmt-start">TMT Mulai</Label>
                  <Input id="profile-tmt-start" type="date" value={form.tmtStartDate} onChange={(event) => updateField("tmtStartDate", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-tmt-end">TMT Selesai</Label>
                  <Input id="profile-tmt-end" type="date" value={form.tmtEndDate} onChange={(event) => updateField("tmtEndDate", event.target.value)} />
                </div>
              </>
            ) : null}
          </CardContainer>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending || isCooldownActive}>
              <span className="inline-flex size-4 items-center justify-center">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              </span>
              <span>Simpan Perubahan</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
