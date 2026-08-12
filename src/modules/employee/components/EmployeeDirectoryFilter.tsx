"use client";

import { Filter, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  MARITAL_STATUS_OPTIONS,
} from "@/modules/employee";

export type EmployeeDirectoryFilterValues = {
  search: string;
  employmentStatusId: string;
  employeeGroupId: string;
  professionGroupId: string;
  employeePositionId: string;
  employeeRankId: string;
  workplaceId: string;
  maritalStatus: string;
  lastEducation: string;
  tmtStartDate: string;
  tmtEndDate: string;
  retirementAgeFrom: string;
  retirementAgeTo: string;
  status: string;
};

export type EmployeeFilterOption = {
  id: string;
  name: string;
};

type EmployeeGroupOption = EmployeeFilterOption & {
  employmentStatusId: string;
};

type EmployeePositionOption = EmployeeFilterOption & {
  professionGroupId: string;
};

export type EmployeeDirectoryFilterOptions = {
  employmentStatuses: EmployeeFilterOption[];
  employeeGroups: EmployeeGroupOption[];
  professionGroups: EmployeeFilterOption[];
  employeePositions: EmployeePositionOption[];
  employeeRanks: EmployeeFilterOption[];
  workplaces: EmployeeFilterOption[];
};

type EmployeeDirectoryFilterProps = {
  values: EmployeeDirectoryFilterValues;
  options: EmployeeDirectoryFilterOptions;
  onValueChange: (key: keyof EmployeeDirectoryFilterValues, value: string) => void;
  onApply: () => void;
  onReset: () => void;
};

const ALL_VALUE = "all";

export function EmployeeDirectoryFilter({
  values,
  options,
  onValueChange,
  onApply,
  onReset,
}: EmployeeDirectoryFilterProps) {
  const filteredEmployeeGroups = values.employmentStatusId
    ? options.employeeGroups.filter(
        (group) => group.employmentStatusId === values.employmentStatusId,
      )
    : [];

  const filteredEmployeePositions = values.professionGroupId
    ? options.employeePositions.filter(
        (position) => position.professionGroupId === values.professionGroupId,
      )
    : [];

  const handleSelectChange = (
    key: keyof EmployeeDirectoryFilterValues,
    value: string | null,
  ) => {
    onValueChange(key, !value || value === ALL_VALUE ? "" : value);
  };

  return (
    <Card className="border-muted-foreground/10 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="size-4" />
          Filter & Pencarian
        </CardTitle>
        <CardDescription>
          Cari dan saring pegawai berdasarkan data kepegawaian, pendidikan, TMT, usia, dan status.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari nama, NIP, NIK, atau email..."
            value={values.search}
            onChange={(event) => onValueChange("search", event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onApply();
            }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <Select
            value={values.employmentStatusId || ALL_VALUE}
            onValueChange={(value) => {
              handleSelectChange("employmentStatusId", value);
              onValueChange("employeeGroupId", "");
            }}
          >
            <SelectTrigger aria-label="Status kepegawaian">
              <SelectValue placeholder="Status Kepegawaian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Status Kepegawaian</SelectItem>
              {options.employmentStatuses.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={values.employeeGroupId || ALL_VALUE}
            onValueChange={(value) => handleSelectChange("employeeGroupId", value)}
            disabled={!values.employmentStatusId}
          >
            <SelectTrigger aria-label="Jenis kepegawaian">
              <SelectValue
                placeholder={
                  values.employmentStatusId
                    ? "Jenis Kepegawaian"
                    : "Pilih status dulu"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Jenis Kepegawaian</SelectItem>
              {filteredEmployeeGroups.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={values.professionGroupId || ALL_VALUE}
            onValueChange={(value) => {
              handleSelectChange("professionGroupId", value);
              onValueChange("employeePositionId", "");
            }}
          >
            <SelectTrigger aria-label="Kelompok profesi">
              <SelectValue placeholder="Kelompok Profesi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Kelompok Profesi</SelectItem>
              {options.professionGroups.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={values.employeePositionId || ALL_VALUE}
            onValueChange={(value) => handleSelectChange("employeePositionId", value)}
            disabled={!values.professionGroupId}
          >
            <SelectTrigger aria-label="Jabatan pegawai">
              <SelectValue
                placeholder={
                  values.professionGroupId
                    ? "Jabatan Pegawai"
                    : "Pilih profesi dulu"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Jabatan Pegawai</SelectItem>
              {filteredEmployeePositions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={values.employeeRankId || ALL_VALUE}
            onValueChange={(value) => handleSelectChange("employeeRankId", value)}
          >
            <SelectTrigger aria-label="Golongan">
              <SelectValue placeholder="Golongan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Golongan</SelectItem>
              {options.employeeRanks.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={values.workplaceId || ALL_VALUE}
            onValueChange={(value) => handleSelectChange("workplaceId", value)}
          >
            <SelectTrigger aria-label="Unit kerja">
              <SelectValue placeholder="Unit Kerja" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Unit Kerja</SelectItem>
              {options.workplaces.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={values.maritalStatus || ALL_VALUE}
            onValueChange={(value) => handleSelectChange("maritalStatus", value)}
          >
            <SelectTrigger aria-label="Status pernikahan">
              <SelectValue placeholder="Status Pernikahan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Status Pernikahan</SelectItem>
              {MARITAL_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={values.lastEducation || ALL_VALUE}
            onValueChange={(value) => handleSelectChange("lastEducation", value)}
          >
            <SelectTrigger aria-label="Pendidikan terakhir">
              <SelectValue placeholder="Pendidikan Terakhir" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Pendidikan Terakhir</SelectItem>
              {EDUCATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={values.status || ALL_VALUE}
            onValueChange={(value) => handleSelectChange("status", value)}
          >
            <SelectTrigger aria-label="Status pegawai">
              <SelectValue placeholder="Status Pegawai" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Status Pegawai</SelectItem>
              {EMPLOYEE_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Awal</span>
                <Input
                  className="px-2 text-xs"
                  aria-label="TMT awal"
                  type="date"
                  value={values.tmtStartDate}
                  onChange={(event) => onValueChange("tmtStartDate", event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Akhir</span>
                <Input
                  className="px-2 text-xs"
                  aria-label="TMT akhir"
                  type="date"
                  value={values.tmtEndDate}
                  onChange={(event) => onValueChange("tmtEndDate", event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Usia Dari</span>
                <Input
                  className="px-2 text-xs"
                  aria-label="Usia pensiun dari"
                  inputMode="numeric"
                  type="number"
                  min={0}
                  value={values.retirementAgeFrom}
                  onChange={(event) => onValueChange("retirementAgeFrom", event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Usia Sampai</span>
                <Input
                  className="px-2 text-xs"
                  aria-label="Usia pensiun sampai"
                  inputMode="numeric"
                  type="number"
                  min={0}
                  value={values.retirementAgeTo}
                  onChange={(event) => onValueChange("retirementAgeTo", event.target.value)}
                />
              </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" className="gap-2" onClick={onApply}>
            <Search className="size-4" />
            Terapkan
          </Button>
          <Button type="button" variant="outline" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
