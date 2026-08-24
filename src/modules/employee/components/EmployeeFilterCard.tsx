"use client";

import { Button } from "@/components/ui/button";
import { CardContainer } from "@/components/cards/CardContainer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search } from "lucide-react";
import type { EmployeeDirectoryFilterValues } from "../types/filter.types";

type EmployeeFilterOptions = {
  employmentStatuses: { id: string; name: string }[];
  employeeGroups: { id: string; name: string; employmentStatusId: string }[];
  professionGroups: { id: string; name: string }[];
  employeePositions: { id: string; name: string; professionGroupId: string }[];
  employeeRanks: { id: string; name: string; code?: string }[];
  workplaces: { id: string; name: string }[];
};

type EmployeeFilterCardProps = {
  filters: EmployeeDirectoryFilterValues;
  filterOptions: EmployeeFilterOptions;
  onFieldChange: (field: keyof EmployeeDirectoryFilterValues, value: string) => void;
  onApply: () => void;
  onReset: () => void;
  maritalStatusOptions: readonly { value: string; label: string }[];
  educationOptions: readonly { value: string; label: string }[];
  employeeStatusOptions: readonly { value: string; label: string }[];
};

export function EmployeeFilterCard({
  filters,
  filterOptions,
  onFieldChange,
  onApply,
  onReset,
  maritalStatusOptions,
  educationOptions,
  employeeStatusOptions,
}: EmployeeFilterCardProps) {
  return (
    <CardContainer
      icon={Filter}
      title="Filter & Pencarian"
      description="Cari dan saring pegawai berdasarkan data kepegawaian, pendidikan, TMT, usia, dan status."
      descriptionClassName="hidden sm:block"
      headerClassName="pb-2"
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari nama, NIP, NIK, atau email..."
            value={filters.search}
            onChange={(e) => onFieldChange("search", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onApply();
            }}
          />
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
          <Select
            value={filters.employmentStatusId || "all"}
            onValueChange={(val) => {
              onFieldChange("employmentStatusId", !val || val === "all" ? "" : val);
              onFieldChange("employeeGroupId", "");
            }}
          >
            <SelectTrigger className="w-full" aria-label="Status kepegawaian">
              <SelectValue placeholder="Status Kepegawaian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Status Kepegawaian</SelectItem>
              {filterOptions.employmentStatuses.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.employeeGroupId || "all"}
            onValueChange={(val) => onFieldChange("employeeGroupId", !val || val === "all" ? "" : val)}
            disabled={!filters.employmentStatusId}
          >
            <SelectTrigger className="w-full" aria-label="Jenis kepegawaian">
              <SelectValue placeholder={filters.employmentStatusId ? "Jenis Kepegawaian" : "Pilih status dulu"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Jenis Kepegawaian</SelectItem>
              {(filters.employmentStatusId
                ? filterOptions.employeeGroups.filter((g) => g.employmentStatusId === filters.employmentStatusId)
                : []
              ).map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.professionGroupId || "all"}
            onValueChange={(val) => {
              onFieldChange("professionGroupId", !val || val === "all" ? "" : val);
              onFieldChange("employeePositionId", "");
            }}
          >
            <SelectTrigger className="w-full" aria-label="Kelompok profesi">
              <SelectValue placeholder="Kelompok Profesi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Kelompok Profesi</SelectItem>
              {filterOptions.professionGroups.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.employeePositionId || "all"}
            onValueChange={(val) => onFieldChange("employeePositionId", !val || val === "all" ? "" : val)}
            disabled={!filters.professionGroupId}
          >
            <SelectTrigger className="w-full" aria-label="Jabatan pegawai">
              <SelectValue placeholder={filters.professionGroupId ? "Jabatan Pegawai" : "Pilih profesi dulu"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Jabatan Pegawai</SelectItem>
              {(filters.professionGroupId
                ? filterOptions.employeePositions.filter((p) => p.professionGroupId === filters.professionGroupId)
                : []
              ).map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.employeeRankId || "all"}
            onValueChange={(val) => onFieldChange("employeeRankId", !val || val === "all" ? "" : val)}
          >
            <SelectTrigger className="w-full" aria-label="Pangkat/Golongan">
              <SelectValue placeholder="Pangkat/Golongan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Pangkat/Golongan</SelectItem>
              {filterOptions.employeeRanks.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.workplaceId || "all"}
            onValueChange={(val) => onFieldChange("workplaceId", !val || val === "all" ? "" : val)}
          >
            <SelectTrigger className="w-full" aria-label="Unit kerja">
              <SelectValue placeholder="Unit Kerja" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Unit Kerja</SelectItem>
              {filterOptions.workplaces.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.maritalStatus || "all"}
            onValueChange={(val) => onFieldChange("maritalStatus", !val || val === "all" ? "" : val)}
          >
            <SelectTrigger className="w-full" aria-label="Status pernikahan">
              <SelectValue placeholder="Status Pernikahan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Status Pernikahan</SelectItem>
              {maritalStatusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.lastEducation || "all"}
            onValueChange={(val) => onFieldChange("lastEducation", !val || val === "all" ? "" : val)}
          >
            <SelectTrigger className="w-full" aria-label="Pendidikan terakhir">
              <SelectValue placeholder="Pendidikan Terakhir" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Pendidikan Terakhir</SelectItem>
              {educationOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status || "all"}
            onValueChange={(val) => onFieldChange("status", !val || val === "all" ? "" : val)}
          >
            <SelectTrigger className="w-full" aria-label="Status pegawai">
              <SelectValue placeholder="Status Pegawai" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Status Pegawai</SelectItem>
              {employeeStatusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground">TMT Awal</Label>
            <Input
              type="date"
              className="px-2 text-xs"
              aria-label="TMT awal"
              value={filters.tmtStartDate}
              onChange={(e) => onFieldChange("tmtStartDate", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground">TMT Akhir</Label>
            <Input
              type="date"
              className="px-2 text-xs"
              aria-label="TMT akhir"
              value={filters.tmtEndDate}
              onChange={(e) => onFieldChange("tmtEndDate", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground">Usia Pensiun Dari</Label>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Misal: 55"
              className="px-2 text-xs"
              aria-label="Usia pensiun dari"
              value={filters.retirementAgeFrom}
              onChange={(e) => onFieldChange("retirementAgeFrom", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground">Usia Pensiun Sampai</Label>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Misal: 60"
              className="px-2 text-xs"
              aria-label="Usia pensiun sampai"
              value={filters.retirementAgeTo}
              onChange={(e) => onFieldChange("retirementAgeTo", e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:justify-end">
          <Button type="button" className="gap-2 sm:w-auto" onClick={onApply}>
            <Search className="size-4" />
            Terapkan
          </Button>
          <Button type="button" variant="outline" className="sm:w-auto" onClick={onReset}>
            Reset
          </Button>
        </div>
      </div>
    </CardContainer>
  );
}
