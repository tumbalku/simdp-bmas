"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Pencil, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  MARITAL_STATUS_OPTIONS,
  RELIGION_OPTIONS,
} from "@/modules/employee";

type EditableProfileData = {
  phone: string;
  address: string;
  birthPlace: string;
  birthDate: string;
  religion: string;
  maritalStatus: string;
};

type ProfileEditDialogProps = {
  initialData: EditableProfileData;
};

function nullableValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function ProfileEditDialog({ initialData }: ProfileEditDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(initialData);

  const updateField = (field: keyof EditableProfileData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await updateProfileAction({
        phone: nullableValue(form.phone),
        address: nullableValue(form.address),
        birthPlace: nullableValue(form.birthPlace),
        birthDate: form.birthDate || null,
        religion: nullableValue(form.religion),
        maritalStatus: nullableValue(form.maritalStatus),
      });

      if (result.ok) {
        toast.success("Profil berhasil diperbarui.");
        setOpen(false);
        router.refresh();
        return;
      }

      toast.error(result.error.message);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Pencil className="size-3.5" />
        Edit Profil
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Ubah Profil Saya</DialogTitle>
            <DialogDescription>
              Ubah data kontak dan informasi pribadi yang aman dikelola mandiri. Data kepegawaian tetap dikelola admin.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-phone">No. Telepon</Label>
              <Input
                id="profile-phone"
                type="tel"
                placeholder="08123456789"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-birth-place">Tempat Lahir</Label>
              <Input
                id="profile-birth-place"
                placeholder="Kota lahir"
                value={form.birthPlace}
                onChange={(event) => updateField("birthPlace", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-birth-date">Tanggal Lahir</Label>
              <Input
                id="profile-birth-date"
                type="date"
                value={form.birthDate}
                onChange={(event) => updateField("birthDate", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-religion">Agama</Label>
              <Select value={form.religion || null} onValueChange={(value) => updateField("religion", value ?? "")}>
                <SelectTrigger id="profile-religion">
                  <SelectValue placeholder="Pilih agama" />
                </SelectTrigger>
                <SelectContent>
                  {RELIGION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="profile-marital-status">Status Pernikahan</Label>
              <Select
                value={form.maritalStatus || null}
                onValueChange={(value) => updateField("maritalStatus", value ?? "")}
              >
                <SelectTrigger id="profile-marital-status">
                  <SelectValue placeholder="Pilih status pernikahan" />
                </SelectTrigger>
                <SelectContent>
                  {MARITAL_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="profile-address">Alamat Tinggal</Label>
              <Textarea
                id="profile-address"
                placeholder="Alamat lengkap"
                rows={3}
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/25 p-3 text-xs text-muted-foreground">
            NIP, NIK, jabatan, unit kerja, status kepegawaian, role, dan email login tidak bisa diubah dari halaman ini.
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
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
