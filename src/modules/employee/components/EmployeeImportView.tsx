"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/navigation/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bulkCreateEmployeesAction } from "@/modules/employee";
import { GENDER_OPTIONS } from "@/modules/employee";

type MasterDataRecord = {
  id: string;
  name: string;
  employmentStatusId?: string;
  professionGroupId?: string;
};

type Props = {
  employmentStatuses: MasterDataRecord[];
  employeeGroups: (MasterDataRecord & { employmentStatusId: string })[];
  employeeRanks: MasterDataRecord[];
  workplaces: MasterDataRecord[];
};

type ImportRow = {
  tempId: string;
  email: string;
  name: string;
  employeeId: string;
  nik: string;
  role: "ADMIN" | "STAFF" | "EMPLOYEE";
  gender: string;
  birthPlace: string;
  birthDate: string;
  academicDegree: string;
  lastEducation: string;
  religion: string;
  maritalStatus: string;
  phone: string;
  address: string;
  joinDate: string;
  employmentStatusId: string;
  employeeGroupId: string;
  employeePositionId: string;
  employeeRankId: string;
  workplaceId: string;
  status: "ACTIVE" | "RETIRED" | "STUDY_ASSIGNMENT";
  error?: string;
};

const SELECT_CLASS =
  "w-full h-8 text-xs rounded-lg border border-input bg-transparent px-2 py-1 outline-hidden focus:border-ring focus:ring-1 focus:ring-ring disabled:opacity-50";

const EMPLOYEE_IMPORT_TEMPLATE = [
  "email;name;nip;nik;gender;birthPlace;birthDate;academicDegree;lastEducation;religion;maritalStatus;phone;address;joinDate",
  "pegawai@example.com;Andri Saputra, S.Ked.;198501012010011001;7471010101010001;Laki-laki;Kendari;1990-01-01;S.Ked.;S1;Islam;Kawin;081234567890;Jl. Contoh No. 1;2020-01-01",
].join("\n");

export function EmployeeImportView({
  employmentStatuses,
  employeeGroups,
  employeeRanks,
  workplaces,
}: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleDownloadTemplate = () => {
    const blob = new Blob([`\uFEFF${EMPLOYEE_IMPORT_TEMPLATE}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Template-Import-Pegawai_SiCantIK.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const parseCsvLine = (line: string, delimiter: string) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    values.push(current.trim());
    return values;
  };

  const getCanonicalGender = (value: string): string => {
    const normalized = value.trim().toLowerCase();
    if (
      normalized === "pria" ||
      normalized === "laki-laki" ||
      normalized === "laki_laki" ||
      normalized === "male" ||
      normalized === "m"
    ) {
      return "MALE";
    }
    if (
      normalized === "wanita" ||
      normalized === "perempuan" ||
      normalized === "female" ||
      normalized === "f"
    ) {
      return "FEMALE";
    }
    return "";
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("File harus berformat CSV.");
      return;
    }

    try {
      const text = await file.text();
      const lines = text
        .split("\n")
        .map((line) => line.replace("\r", ""))
        .filter((line) => line.trim().length > 0);

      if (lines.length === 0) {
        toast.error("File CSV kosong.");
        return;
      }

      const delimiter = lines[0].includes(";") ? ";" : ",";
      const headers = parseCsvLine(lines[0], delimiter).map((h) =>
        h.replace(/^\uFEFF/, "").trim(),
      );

      const newRows: ImportRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i], delimiter);
        const rowData: Record<string, string> = {};

        headers.forEach((header, idx) => {
          rowData[header] = values[idx] || "";
        });

        newRows.push({
          tempId: crypto.randomUUID(),
          email: rowData.email || "",
          name: rowData.name || "",
          employeeId: rowData.employeeId || rowData.nip || "",
          nik: rowData.nik || "",
          role: "EMPLOYEE",
          gender: getCanonicalGender(rowData.gender || ""),
          birthPlace: rowData.birthPlace || "",
          birthDate: rowData.birthDate || "",
          academicDegree: rowData.academicDegree || "",
          lastEducation: rowData.lastEducation || "",
          religion: rowData.religion || "",
          maritalStatus: rowData.maritalStatus || "",
          phone: rowData.phone || "",
          address: rowData.address || "",
          joinDate: rowData.joinDate || "",
          employmentStatusId: rowData.employmentStatusId || "",
          employeeGroupId: "",
          employeePositionId: "",
          employeeRankId: "",
          workplaceId: "",
          status: "ACTIVE",
        });
      }

      setRows((prev) => [...prev, ...newRows]);
      toast.success(`Berhasil mengimpor ${newRows.length} baris dari CSV.`);
      event.target.value = ""; // reset input file
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      toast.error(`Gagal membaca file: ${errorMsg}`);
    }
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        email: "",
        name: "",
        employeeId: "",
        nik: "",
        role: "EMPLOYEE",
        gender: "",
        birthPlace: "",
        birthDate: "",
        academicDegree: "",
        lastEducation: "",
        religion: "",
        maritalStatus: "",
        phone: "",
        address: "",
        joinDate: "",
        employmentStatusId: "",
        employeeGroupId: "",
        employeePositionId: "",
        employeeRankId: "",
        workplaceId: "",
        status: "ACTIVE",
      },
    ]);
  };

  const handleUpdateRow = (
    tempId: string,
    field: keyof ImportRow,
    value:
      | string
      | "ADMIN"
      | "STAFF"
      | "EMPLOYEE"
      | "ACTIVE"
      | "RETIRED"
      | "STUDY_ASSIGNMENT",
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.tempId === tempId
          ? { ...row, [field]: value, error: undefined }
          : row,
      ),
    );
  };

  const handleUpdateMultipleFields = (
    tempId: string,
    updates: Partial<ImportRow>,
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.tempId === tempId ? { ...row, ...updates, error: undefined } : row,
      ),
    );
  };

  const handleRemoveRow = (tempId: string) => {
    setRows((prev) => prev.filter((row) => row.tempId !== tempId));
  };

  const handleSaveAll = () => {
    if (rows.length === 0) {
      toast.error("Tidak ada data pegawai untuk disimpan.");
      return;
    }

    // Client-side quick check
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.name || !r.email) {
        toast.error(`Baris ${i + 1}: Nama dan Email wajib diisi.`);
        return;
      }
      if (!r.employeeId && !r.nik) {
        toast.error(`Baris ${i + 1}: NIP atau NIK wajib diisi.`);
        return;
      }
    }

    startTransition(async () => {
      const response = await bulkCreateEmployeesAction(rows);

      if (!response.ok) {
        toast.error(response.error.message);
        return;
      }

      const { importedCount, failedCount, errors } = response.data as {
        importedCount: number;
        failedCount: number;
        errors: Array<{ row: number; error: string }>;
      };

      if (failedCount > 0) {
        toast.warning(
          `Selesai: ${importedCount} berhasil disimpan, ${failedCount} gagal.`,
        );
        // filter out successfully imported rows and assign error messages to failed rows
        const errorMap = new Map<number, string>();
        errors.forEach((e) => {
          errorMap.set(e.row - 1, e.error);
        });

        setRows((prev) => {
          return prev.reduce<ImportRow[]>((acc, row, idx) => {
            if (errorMap.has(idx)) {
              acc.push({ ...row, error: errorMap.get(idx) });
            }
            return acc;
          }, []);
        });
        return;
      }

      toast.success(`Berhasil menyimpan ${importedCount} pegawai.`);
      router.push("/master-data/employees");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Pegawai"
        description="Preview, modifikasi, dan simpan data pegawai dari file CSV secara massal."
        backHref="/master-data/employees"
        backLabel="Kembali ke Daftar Pegawai"
      />

      <Card className="border-muted-foreground/10 shadow-sm">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Download Template File</h3>
              <p className="text-xs text-muted-foreground">
                Gunakan template CSV resmi agar pemetaan data kolom tidak salah
                saat diunggah.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              disabled={isPending}
            >
              <Download className="mr-2 size-4" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-muted-foreground/10 shadow-sm">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Label htmlFor="csvFile" className="text-sm font-medium">
                Pilih File CSV
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="max-w-xs"
                  disabled={isPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddRow}
                  disabled={isPending}
                >
                  <Plus className="mr-2 size-4" />
                  Tambah Manual
                </Button>
              </div>
            </div>
            {rows.length > 0 && (
              <Button
                type="button"
                disabled={isPending}
                onClick={handleSaveAll}
                className="sm:self-end"
              >
                <span className="flex items-center gap-2">
                  <Save
                    className={`size-4 ${isPending ? "hidden" : "block"}`}
                  />
                  <span>
                    {isPending
                      ? "Menyimpan..."
                      : `Simpan Semua (${rows.length})`}
                  </span>
                </span>
              </Button>
            )}
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[1200px]">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[180px]">Nama Lengkap *</TableHead>
                  <TableHead className="w-[160px]">Email *</TableHead>
                  <TableHead className="w-[140px]">NIP</TableHead>
                  <TableHead className="w-[140px]">NIK</TableHead>
                  <TableHead className="w-[110px]">Jenis Kelamin *</TableHead>
                  <TableHead className="w-[130px]">
                    Status Kepegawaian *
                  </TableHead>
                  <TableHead className="w-[130px]">
                    Kelompok Kepegawaian *
                  </TableHead>
                  <TableHead className="w-[130px]">
                    Pangkat/Golongan *
                  </TableHead>
                  <TableHead className="w-[130px]">Unit Kerja *</TableHead>
                  <TableHead className="w-[70px] text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Belum ada data. Silakan upload file CSV atau tambahkan
                      baris manual.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <Fragment key={row.tempId}>
                      <TableRow
                        className={
                          row.error
                            ? "border-b-0 bg-destructive/5 hover:bg-destructive/10"
                            : ""
                        }
                      >
                        <TableCell>
                          <Input
                            value={row.name}
                            onChange={(e) =>
                              handleUpdateRow(
                                row.tempId,
                                "name",
                                e.target.value,
                              )
                            }
                            placeholder="Nama lengkap pegawai"
                            className="h-8 text-xs"
                            disabled={isPending}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="email"
                            value={row.email}
                            onChange={(e) =>
                              handleUpdateRow(
                                row.tempId,
                                "email",
                                e.target.value,
                              )
                            }
                            placeholder="alamat.email@contoh.com"
                            className="h-8 text-xs"
                            disabled={isPending}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.employeeId}
                            onChange={(e) =>
                              handleUpdateRow(
                                row.tempId,
                                "employeeId",
                                e.target.value,
                              )
                            }
                            placeholder="NIP"
                            className="h-8 text-xs"
                            disabled={isPending}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.nik}
                            onChange={(e) =>
                              handleUpdateRow(row.tempId, "nik", e.target.value)
                            }
                            placeholder="NIK"
                            className="h-8 text-xs"
                            disabled={isPending}
                          />
                        </TableCell>
                        <TableCell>
                          <select
                            value={row.gender || ""}
                            onChange={(e) =>
                              handleUpdateRow(
                                row.tempId,
                                "gender",
                                e.target.value,
                              )
                            }
                            className={SELECT_CLASS}
                            disabled={isPending}
                          >
                            <option value="">Pilih...</option>
                            {GENDER_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <select
                            value={row.employmentStatusId || ""}
                            onChange={(e) => {
                              handleUpdateMultipleFields(row.tempId, {
                                employmentStatusId: e.target.value,
                                employeeGroupId: "",
                              });
                            }}
                            className={SELECT_CLASS}
                            disabled={isPending}
                          >
                            <option value="">Pilih...</option>
                            {employmentStatuses.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <select
                            value={row.employeeGroupId || ""}
                            onChange={(e) =>
                              handleUpdateRow(
                                row.tempId,
                                "employeeGroupId",
                                e.target.value,
                              )
                            }
                            disabled={!row.employmentStatusId || isPending}
                            className={SELECT_CLASS}
                          >
                            <option value="">
                              {!row.employmentStatusId
                                ? "Pilih status kepegawaian dulu"
                                : "Pilih..."}
                            </option>
                            {employeeGroups
                              .filter(
                                (g) =>
                                  g.employmentStatusId ===
                                  row.employmentStatusId,
                              )
                              .map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name}
                                </option>
                              ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <select
                            value={row.employeeRankId || ""}
                            onChange={(e) =>
                              handleUpdateRow(
                                row.tempId,
                                "employeeRankId",
                                e.target.value,
                              )
                            }
                            className={SELECT_CLASS}
                            disabled={isPending}
                          >
                            <option value="">Pilih...</option>
                            {employeeRanks.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <select
                            value={row.workplaceId || ""}
                            onChange={(e) =>
                              handleUpdateRow(
                                row.tempId,
                                "workplaceId",
                                e.target.value,
                              )
                            }
                            className={SELECT_CLASS}
                            disabled={isPending}
                          >
                            <option value="">Pilih...</option>
                            {workplaces.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleRemoveRow(row.tempId)}
                            disabled={isPending}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {row.error && (
                        <TableRow className="border-t-0 bg-destructive/5 hover:bg-destructive/10">
                          <TableCell
                            colSpan={10}
                            className="pt-0 pb-2 text-xs font-semibold text-destructive"
                          >
                            <div className="flex items-center gap-1.5 pl-2">
                              <span>Gagal:</span>
                              <span>{row.error}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
