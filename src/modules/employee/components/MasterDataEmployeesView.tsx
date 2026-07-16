"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, UserPlus, Eye } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { PaginationItems } from "@/components/shared/PaginationItems";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableCard } from "@/components/shared/DataTableCard";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PAGINATION } from "@/constants";
import {
  EmployeeDirectoryFilter,
  type EmployeeDirectoryFilterOptions,
  type EmployeeDirectoryFilterValues,
} from "./EmployeeDirectoryFilter";

type EmployeeSummary = {
  id: string;
  employeeId: string | null;
  nik: string | null;
  name: string;
  gender: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  status: string;
  isActive: boolean;
  employmentStatus: string | null;
  workplace: string | null;
  documentCount: number;
};

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type MasterDataEmployeesViewProps = {
  employees: EmployeeSummary[];
  pagination: PaginationMeta;
  filterOptions: EmployeeDirectoryFilterOptions;
};

const FILTER_KEYS = [
  "search",
  "employmentStatusId",
  "employeeGroupId",
  "professionGroupId",
  "employeePositionId",
  "employeeRankId",
  "workplaceId",
  "maritalStatus",
  "lastEducation",
  "tmtStartDate",
  "tmtEndDate",
  "retirementAgeFrom",
  "retirementAgeTo",
  "status",
] as const satisfies ReadonlyArray<keyof EmployeeDirectoryFilterValues>;

function getInitialFilterValues(
  searchParams: ReturnType<typeof useSearchParams>,
): EmployeeDirectoryFilterValues {
  return {
    search: searchParams.get("search") ?? "",
    employmentStatusId: searchParams.get("employmentStatusId") ?? "",
    employeeGroupId: searchParams.get("employeeGroupId") ?? "",
    professionGroupId: searchParams.get("professionGroupId") ?? "",
    employeePositionId: searchParams.get("employeePositionId") ?? "",
    employeeRankId: searchParams.get("employeeRankId") ?? "",
    workplaceId: searchParams.get("workplaceId") ?? "",
    maritalStatus: searchParams.get("maritalStatus") ?? "",
    lastEducation: searchParams.get("lastEducation") ?? "",
    tmtStartDate: searchParams.get("tmtStartDate") ?? "",
    tmtEndDate: searchParams.get("tmtEndDate") ?? "",
    retirementAgeFrom: searchParams.get("retirementAgeFrom") ?? "",
    retirementAgeTo: searchParams.get("retirementAgeTo") ?? "",
    status: searchParams.get("status") ?? "",
  };
}

export function MasterDataEmployeesView({
  employees,
  pagination,
  filterOptions,
}: MasterDataEmployeesViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(() =>
    getInitialFilterValues(searchParams),
  );

  const buildPageUrl = (page: number, nextFilters = filters) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", String(pagination.limit || PAGINATION.defaultPageSize));

    FILTER_KEYS.forEach((key) => {
      const value = nextFilters[key].trim();
      if (value) params.set(key, value);
    });

    return `/master-data/employees?${params.toString()}`;
  };

  const handleValueChange = (key: keyof EmployeeDirectoryFilterValues, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleFilter = () => {
    router.push(buildPageUrl(PAGINATION.defaultPage));
  };

  const handleRowsPerPageChange = (value: string | null) => {
    const nextLimit = value ?? String(PAGINATION.defaultPageSize);
    const params = new URLSearchParams();
    params.set("page", String(PAGINATION.defaultPage));
    params.set("limit", nextLimit);

    FILTER_KEYS.forEach((key) => {
      const filterValue = filters[key].trim();
      if (filterValue) params.set(key, filterValue);
    });

    router.push(`/master-data/employees?${params.toString()}`);
  };

  const handleResetFilter = () => {
    const resetFilters: EmployeeDirectoryFilterValues = {
      search: "",
      employmentStatusId: "",
      employeeGroupId: "",
      professionGroupId: "",
      employeePositionId: "",
      employeeRankId: "",
      workplaceId: "",
      maritalStatus: "",
      lastEducation: "",
      tmtStartDate: "",
      tmtEndDate: "",
      retirementAgeFrom: "",
      retirementAgeTo: "",
      status: "",
    };
    setFilters(resetFilters);
    router.push(buildPageUrl(PAGINATION.defaultPage, resetFilters));
  };

  const employeeColumns: DataTableColumn<EmployeeSummary>[] = [
    {
      key: "employee",
      header: "Pegawai",
      headClassName: "w-[300px]",
      cell: (emp) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground">{emp.name}</div>
          <div className="text-xs text-muted-foreground">
            NIP {emp.employeeId || "-"} • NIK {emp.nik || "-"}
          </div>
        </div>
      ),
    },
    {
      key: "account",
      header: "Akun",
      cell: (emp) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{emp.email || "-"}</div>
          <div className="text-xs text-muted-foreground">{emp.role}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (emp) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {emp.status}
          </Badge>
          {!emp.isActive ? (
            <span className="text-xs text-muted-foreground">Akun nonaktif</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "workplace",
      header: "Unit Kerja",
      cellClassName: "text-muted-foreground",
      cell: (emp) => emp.workplace || "-",
    },
    {
      key: "documents",
      header: "Dokumen",
      headClassName: "w-[100px] text-center",
      cellClassName: "text-center font-medium",
      cell: (emp) => emp.documentCount,
    },
    {
      key: "action",
      header: "Aksi",
      headClassName: "w-[100px] text-right",
      cellClassName: "text-right",
      cell: (emp) => (
        <Link
          className={buttonVariants({ variant: "outline", size: "xs" })}
          href={`/master-data/employees/${emp.id}`}
        >
          <Eye className="size-3.5" />
          <span className="hidden md:inline">Detail</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Pegawai"
        description="Kelola direktori pegawai, akun, unit kerja, dan ringkasan dokumen."
        actions={[
          {
            label: "Tambah Pegawai",
            href: "/master-data/employees/add",
            icon: UserPlus,
          }
        ]}
      />

      <EmployeeDirectoryFilter
        values={filters}
        options={filterOptions}
        onValueChange={handleValueChange}
        onApply={handleFilter}
        onReset={handleResetFilter}
      />

      <DataTableCard
        title="Daftar Pegawai"
        description={`Total ${pagination.total} pegawai - Halaman ${pagination.page} dari ${pagination.totalPages || 1}`}
        icon={<Users className="size-4 text-muted-foreground" />}
        rowsPerPageControl={{
          value: String(pagination.limit || PAGINATION.defaultPageSize),
          onValueChange: handleRowsPerPageChange,
          options: PAGINATION.pageSizeOptions,
          label: "Tampilkan",
          suffix: "row",
        }}
        tableMinWidthClassName="min-w-[820px]"
        table={
          <DataTable
            data={employees}
            columns={employeeColumns}
            getRowKey={(emp) => emp.id}
            emptyMessage="Tidak ada pegawai yang sesuai pencarian."
            headerClassName="bg-muted/20"
          />
        }
        footerSummary={
          <p className="text-xs text-muted-foreground">
            Menampilkan {employees.length} dari {pagination.total} pegawai.
          </p>
        }
        pagination={
          pagination.totalPages > 1 ? (
            <Pagination className="sm:ml-auto sm:w-auto">
              <PaginationContent>
                {pagination.page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious href={buildPageUrl(pagination.page - 1)} />
                  </PaginationItem>
                )}
                <PaginationItems
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  getHref={buildPageUrl}
                />
                {pagination.page < pagination.totalPages && (
                  <PaginationItem>
                    <PaginationNext href={buildPageUrl(pagination.page + 1)} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          ) : undefined
        }
      />
    </div>
  );
}
