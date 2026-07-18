"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, FileUp } from "lucide-react";
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
import { importEmployeesAction } from "@/modules/employee";

type ImportResult = {
  importedCount: number;
  failedCount: number;
  errors: Array<{ row: number; error: string }>;
};

const EMPLOYEE_IMPORT_TEMPLATE = [
  "email;name;employeeId;nik;role;gender;birthPlace;birthDate;academicDegree;lastEducation;religion;maritalStatus;phone;address;joinDate;employmentStatusId;employeeGroupId;employeePositionId;employeeRankId;workplaceId",
  "pegawai@example.com;Andri Saputra, S.Ked.;198501012010011001;7471010101010001;EMPLOYEE;Laki-laki;Kendari;1990-01-01;S.Ked.;S1;Islam;Kawin;081234567890;Jl. Contoh No. 1;2020-01-01;;;;;",
].join("\n");

export function EmployeeCsvImportDialog() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const response = await importEmployeesAction(formData);

      if (!response.ok) {
        toast.error(response.error.message);
        return;
      }

      setResult(response.data);
      router.refresh();

      if (response.data.failedCount > 0) {
        toast.warning(
          `Import selesai: ${response.data.importedCount} berhasil, ${response.data.failedCount} gagal.`,
        );
        return;
      }

      toast.success(`Import CSV berhasil: ${response.data.importedCount} pegawai ditambahkan.`);
      formRef.current?.reset();
      setOpen(false);
    });
  }

  function handleDownloadTemplate() {
    const blob = new Blob([`\uFEFF${EMPLOYEE_IMPORT_TEMPLATE}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Template-Import-Pegawai_SIMDP.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <FileUp className="size-3.5" />
        Import CSV
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import data pegawai</DialogTitle>
          <DialogDescription>
            Unggah file CSV untuk menambahkan pegawai secara massal. Akun baru tidak memakai password default;
            akses diberikan lewat alur reset password.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employeeCsvFile">File CSV</Label>
            <Input id="employeeCsvFile" name="file" type="file" accept=".csv,text/csv" required />
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-medium text-foreground">Format file import</p>
              <Button type="button" variant="outline" size="xs" onClick={handleDownloadTemplate}>
                <Download className="size-3.5" />
                Unduh template
              </Button>
            </div>
            <p>
              <code>email</code>, <code>name</code>, dan salah satu dari <code>employeeId</code> atau <code>nik</code>.
            </p>
            <p className="mt-2">
              Template memakai pemisah <code>;</code> agar gelar nama dengan koma tetap aman, misalnya
              <code> Andri Saputra, S.Ked.</code>.
            </p>
            <p className="mt-2">
              Kolom opsional: <code>role</code>, <code>gender</code>, <code>birthDate</code>, <code>phone</code>,
              <code>address</code>, <code>employmentStatusId</code>, <code>employeeGroupId</code>,
              <code>employeePositionId</code>, <code>employeeRankId</code>, <code>workplaceId</code>.
            </p>
          </div>

          {result ? (
            <div className="rounded-lg border p-3 text-xs">
              <p className="font-medium text-foreground">
                Hasil: {result.importedCount} berhasil, {result.failedCount} gagal.
              </p>
              {result.errors.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                  {result.errors.slice(0, 5).map((error) => (
                    <li key={`${error.row}-${error.error}`}>
                      Baris {error.row}: {error.error}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Mengimpor..." : "Import CSV"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
