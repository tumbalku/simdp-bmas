"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText, Search, Filter } from "lucide-react";
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
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { DATE_FORMATS, DATE_LOCALE, PAGINATION, ROUTES } from "@/constants";
import { DOCUMENT_STATUS_OPTIONS, DOCUMENT_STATUS_VARIANTS } from "@/modules/document/constants";

type DocumentRecord = {
  id: string;
  title: string;
  status: string;
  uploadedAt: string;
  expiryDate: string | null;
  fileName: string;
  fileSize: number | null;
  documentTypeName: string;
  archiveCategory: string;
  ownerName: string;
  ownerEmployeeId: string | null;
};

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type MasterDataDocumentsViewProps = {
  documents: DocumentRecord[];
  pagination: PaginationMeta;
};

const statusConfig = Object.fromEntries(
  DOCUMENT_STATUS_OPTIONS.map(({ value, label }) => [
    value,
    { label, variant: DOCUMENT_STATUS_VARIANTS[value] },
  ])
) as Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }>;

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMATS.date).format(new Date(value));
}

function formatFileSize(value: number | null) {
  if (!value) return "-";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function MasterDataDocumentsView({ documents, pagination }: MasterDataDocumentsViewProps) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState<string>(
    () => searchParams.get("status") ?? "all",
  );
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    String(pagination.limit || PAGINATION.defaultPageSize),
  );

  const buildPageUrl = (page: number, limit = rowsPerPage) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit);
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    return `${ROUTES.masterDataDocuments}?${params.toString()}`;
  };

  const handleFilter = () => {
    window.location.href = buildPageUrl(PAGINATION.defaultPage);
  };

  const handleRowsPerPageChange = (value: string | null) => {
    const nextLimit = value ?? rowsPerPage;
    setRowsPerPage(nextLimit);
    window.location.href = buildPageUrl(PAGINATION.defaultPage, nextLimit);
  };

  const handleResetFilter = () => {
    window.location.href = `${ROUTES.masterDataDocuments}?limit=${rowsPerPage}`;
  };

  const renderPaginationItems = () => {
    const items = [];
    const { page, totalPages } = pagination;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - 1 && i <= page + 1)
      ) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink href={buildPageUrl(i)} isActive={i === page}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      } else if (i === page - 2 || i === page + 2) {
        items.push(
          <PaginationItem key={i}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    return items;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dokumen Pegawai"
        description="Pantau seluruh dokumen pegawai, status verifikasi, dan metadata berkas."
      />

      <Card className="border-muted-foreground/10 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="size-5" />
            Filter & Pencarian
          </CardTitle>
          <CardDescription>
            Cari dokumen berdasarkan nama file, pemilik, atau status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_180px_auto] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="search">Cari dokumen</Label>
              <Input
                id="search"
                className="h-9"
                placeholder="Nama file, pemilik..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || "all")}>
                <SelectTrigger id="status" className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {DOCUMENT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rows-per-page">Row per halaman</Label>
              <Select value={rowsPerPage} onValueChange={handleRowsPerPageChange}>
                <SelectTrigger id="rows-per-page" className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGINATION.pageSizeOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option} row
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button className="h-9" onClick={handleFilter}>
                <Search className="mr-2 size-4" />
                Terapkan
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
              <FileText className="size-5" />
              Daftar Dokumen
            </CardTitle>
            <CardDescription>
              Total {pagination.total} dokumen - Halaman {pagination.page} dari {pagination.totalPages || 1}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Tampilkan</span>
            <Select value={rowsPerPage} onValueChange={handleRowsPerPageChange}>
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGINATION.pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>row</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-lg border">
            <Table className="min-w-[920px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Dokumen</TableHead>
                  <TableHead>Pemilik</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Upload</TableHead>
                  <TableHead>Kedaluwarsa</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const config = statusConfig[doc.status] ?? statusConfig.PENDING;
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="font-medium">{doc.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {doc.fileName} - {formatFileSize(doc.fileSize)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{doc.ownerName}</div>
                        <div className="text-xs text-muted-foreground">
                          {doc.ownerEmployeeId || "NIP belum ada"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{doc.documentTypeName}</div>
                        <div className="text-xs text-muted-foreground">{doc.archiveCategory}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                      <TableCell>{formatDate(doc.expiryDate)}</TableCell>
                      <TableCell className="text-right">
                        <Link
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                          href={`/documents/${doc.id}`}
                        >
                          Detail
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {documents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Tidak ada dokumen yang sesuai filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Menampilkan {documents.length} dari {pagination.total} dokumen.
            </p>
            {pagination.totalPages > 1 ? (
              <Pagination className="sm:ml-auto sm:w-auto">
                <PaginationContent>
                  {pagination.page > 1 && (
                    <PaginationItem>
                      <PaginationPrevious href={buildPageUrl(pagination.page - 1)} />
                    </PaginationItem>
                  )}
                  {renderPaginationItems()}
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
