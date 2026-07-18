"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { addCareerHistoryAction } from "@/modules/employee";
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

const EMPTY_VALUE = "__empty__";

type MasterDataOption = {
  id: string;
  name: string;
};

type EmployeeGroupOption = MasterDataOption & {
  employmentStatusId: string;
};

type EmployeePositionOption = MasterDataOption & {
  professionGroupId: string;
};

type CareerHistoryDialogProps = {
  employeeId: string;
  currentValues: {
    employmentStatusId: string | null;
    employeeGroupId: string | null;
    professionGroupId: string | null;
    employeePositionId: string | null;
    employeeRankId: string | null;
    workplaceId: string | null;
  };
  options: {
    employmentStatuses: MasterDataOption[];
    employeeGroups: EmployeeGroupOption[];
    professionGroups: MasterDataOption[];
    employeePositions: EmployeePositionOption[];
    employeeRanks: MasterDataOption[];
    workplaces: MasterDataOption[];
  };
};

function normalizeSelectValue(value: string | null) {
  return value && value !== EMPTY_VALUE ? value : "";
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getActionErrorMessage(error: { message?: string; details?: Array<{ message?: string }> }) {
  return error.details?.[0]?.message || error.message || "Riwayat karier gagal disimpan.";
}

export function CareerHistoryDialog({ employeeId, currentValues, options }: CareerHistoryDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [effectiveDate, setEffectiveDate] = useState(todayInputValue());
  const [employmentStatusId, setEmploymentStatusId] = useState(currentValues.employmentStatusId ?? "");
  const [employeeGroupId, setEmployeeGroupId] = useState(currentValues.employeeGroupId ?? "");
  const [professionGroupId, setProfessionGroupId] = useState(currentValues.professionGroupId ?? "");
  const [employeePositionId, setEmployeePositionId] = useState(currentValues.employeePositionId ?? "");
  const [employeeRankId, setEmployeeRankId] = useState(currentValues.employeeRankId ?? "");
  const [workplaceId, setWorkplaceId] = useState(currentValues.workplaceId ?? "");
  const [note, setNote] = useState("");

  const filteredGroups = useMemo(
    () => options.employeeGroups.filter((group) => group.employmentStatusId === employmentStatusId),
    [employmentStatusId, options.employeeGroups]
  );

  const filteredPositions = useMemo(
    () => options.employeePositions.filter((position) => position.professionGroupId === professionGroupId),
    [professionGroupId, options.employeePositions]
  );

  const handleEmploymentStatusChange = (value: string | null) => {
    const nextValue = normalizeSelectValue(value);
    setEmploymentStatusId(nextValue);
    if (!nextValue || !options.employeeGroups.some((group) => group.id === employeeGroupId && group.employmentStatusId === nextValue)) {
      setEmployeeGroupId("");
    }
  };

  const handleProfessionGroupChange = (value: string | null) => {
    const nextValue = normalizeSelectValue(value);
    setProfessionGroupId(nextValue);
    if (!nextValue || !options.employeePositions.some((position) => position.id === employeePositionId && position.professionGroupId === nextValue)) {
      setEmployeePositionId("");
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!effectiveDate) {
      toast.error("TMT wajib diisi.");
      return;
    }

    startTransition(async () => {
      const result = await addCareerHistoryAction({
        employeeId,
        effectiveDate,
        employmentStatusId: employmentStatusId || null,
        employeeGroupId: employeeGroupId || null,
        employeePositionId: employeePositionId || null,
        employeeRankId: employeeRankId || null,
        workplaceId: workplaceId || null,
        note: note.trim() || null,
      });

      if (!result.ok) {
        toast.error(getActionErrorMessage(result.error));
        return;
      }

      toast.success("Riwayat karier berhasil ditambahkan.");
      setOpen(false);
      setNote("");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isPending && setOpen(nextOpen)}>
      <DialogTrigger render={<Button size="xs" />}>
        <span className="inline-flex size-3 items-center justify-center">
          <Plus className="size-3" />
        </span>
        <span>Tambah Riwayat</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Tambah Riwayat Karier</DialogTitle>
            <DialogDescription>
              Simpan perubahan status, jabatan, golongan, atau unit kerja pegawai. Riwayat dengan TMT terbaru akan memperbarui penugasan aktif.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
              <Briefcase className="size-3.5" />
              Catatan pengisian
            </div>
            Isi hanya field yang berubah. Jika riwayat lama ditambahkan dengan TMT lebih lama dari riwayat terbaru, data penugasan aktif tidak akan ditimpa.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="careerEffectiveDate">TMT / Tanggal Berlaku <span className="text-destructive">*</span></Label>
              <Input
                id="careerEffectiveDate"
                type="date"
                value={effectiveDate}
                onChange={(event) => setEffectiveDate(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Status Kepegawaian</Label>
              <Select value={employmentStatusId || EMPTY_VALUE} onValueChange={handleEmploymentStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_VALUE}>Tidak diubah</SelectItem>
                  {options.employmentStatuses.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Jenis Kepegawaian</Label>
              <Select
                value={employeeGroupId || EMPTY_VALUE}
                onValueChange={(value) => setEmployeeGroupId(normalizeSelectValue(value))}
                disabled={!employmentStatusId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={employmentStatusId ? "Pilih jenis" : "Pilih status dulu"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_VALUE}>Tidak diubah</SelectItem>
                  {filteredGroups.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kelompok Profesi</Label>
              <Select value={professionGroupId || EMPTY_VALUE} onValueChange={handleProfessionGroupChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelompok profesi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_VALUE}>Tidak diubah</SelectItem>
                  {options.professionGroups.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Jabatan</Label>
              <Select
                value={employeePositionId || EMPTY_VALUE}
                onValueChange={(value) => setEmployeePositionId(normalizeSelectValue(value))}
                disabled={!professionGroupId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={professionGroupId ? "Pilih jabatan" : "Pilih profesi dulu"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_VALUE}>Tidak diubah</SelectItem>
                  {filteredPositions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Golongan</Label>
              <Select value={employeeRankId || EMPTY_VALUE} onValueChange={(value) => setEmployeeRankId(normalizeSelectValue(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih golongan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_VALUE}>Tidak diubah</SelectItem>
                  {options.employeeRanks.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Unit Kerja</Label>
              <Select value={workplaceId || EMPTY_VALUE} onValueChange={(value) => setWorkplaceId(normalizeSelectValue(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih unit kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_VALUE}>Tidak diubah</SelectItem>
                  {options.workplaces.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="careerNote">Catatan</Label>
              <Textarea
                id="careerNote"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Contoh: Mutasi ke unit baru per SK Direktur."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              <span>Batal</span>
            </Button>
            <Button type="submit" disabled={isPending}>
              <span className="inline-flex size-4 items-center justify-center">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              </span>
              <span>Simpan Riwayat</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
