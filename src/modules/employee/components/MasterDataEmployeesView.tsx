"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Users, Search, UserPlus } from "lucide-react";
import { PaginationItems } from "@/components/shared/PaginationItems";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type EmployeeSummary = {
  id: string;
  employeeId: string | null;
  nik: string | null;
  name: string;
  gender: string | null;
  phone: string | null;
  email: string | null;
  role: string;
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
};

export function MasterDataEmployeesView({ employees, pagination }: MasterDataEmployeesViewProps) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    String(pagination.limit || 20),
  );

  const buildPageUrl = (page: number, limit = rowsPerPage) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit);
    if (search) params.set("search", search);
    return `/master-data/employees?${params.toString()}`;
  };

  const handleFilter = () => {
    window.location.href = buildPageUrl(1);
  };

  const handleRowsPerPageChange = (value: string | null) => {
    const nextLimit = value ?? rowsPerPage;
    setRowsPerPage(nextLimit);
    window.location.href = buildPageUrl(1, nextLimit);
  };

  const handleResetFilter = () => {
    window.location.href = `/master-data/employees?limit=${rowsPerPage}`;
  };

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

      <Card className="border-muted-foreground/10 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5" />
            Pencarian Pegawai
          </CardTitle>
          <CardDescription>Cari pegawai berdasarkan nama, NIP, NIK, atau email.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="search">Cari pegawai</Label>
              <Input
                id="search"
                className="h-9"
                placeholder="Nama, NIP, NIK, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-rows-per-page">Row per halaman</Label>
              <Select value={rowsPerPage} onValueChange={handleRowsPerPageChange}>
                <SelectTrigger id="employee-rows-per-page" className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 row</SelectItem>
                  <SelectItem value="20">20 row</SelectItem>
                  <SelectItem value="50">50 row</SelectItem>
                  <SelectItem value="100">100 row</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button className="h-9" onClick={handleFilter}>
                <Search className="mr-2 size-4" />
                Cari
              </Button>
              <Button className="h-9" variant="outline" onClick={handleResetFilter}>
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-muted-foreground/10 shadow-sm">
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Daftar Pegawai
            </CardTitle>
            <CardDescription>
              Total {pagination.total} pegawai - Halaman {pagination.page} dari {pagination.totalPages || 1}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Tampilkan</span>
            <Select value={rowsPerPage} onValueChange={handleRowsPerPageChange}>
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>row</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-lg border">
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Pegawai</TableHead>
                  <TableHead>Akun</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Unit Kerja</TableHead>
                  <TableHead>Dokumen</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="font-medium">{emp.name}</div>
                      <div className="text-xs text-muted-foreground">
                        NIP {emp.employeeId || "-"} - NIK {emp.nik || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{emp.email || "-"}</div>
                      <div className="text-xs text-muted-foreground">{emp.role}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={emp.isActive ? "default" : "secondary"}>
                        {emp.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>{emp.workplace || "-"}</TableCell>
                    <TableCell>{emp.documentCount}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        className={buttonVariants({ variant: "outline", size: "xs" })}
                        href={`/master-data/employees/${emp.id}`}
                      >
                        Detail
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {employees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Tidak ada pegawai yang sesuai pencarian.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Menampilkan {employees.length} dari {pagination.total} pegawai.
            </p>
            {pagination.totalPages > 1 ? (
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
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
