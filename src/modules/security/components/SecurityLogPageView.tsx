"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Activity, AlertTriangle, CheckCircle2, Filter, Search, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DATE_FORMATS, DATE_LOCALE, PAGINATION, ROLE_LABELS, ROUTES } from "@/constants";

type SecurityLogItem = {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  eventType: string;
  resource: string;
  ipAddress: string | null;
  status: string;
  metadata: unknown;
};

type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type SecurityLogPageViewProps = {
  logs: SecurityLogItem[];
  pagination: PaginationMeta;
};

const STATUS_OPTIONS = [
  { value: "all", label: "Semua status" },
  { value: "SUCCESS", label: "Berhasil" },
  { value: "FAILED", label: "Gagal" },
] as const;

export function SecurityLogPageView({ logs, pagination }: SecurityLogPageViewProps) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [eventType, setEventType] = useState(() => searchParams.get("eventType") ?? "");
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "all");
  const [dateFrom, setDateFrom] = useState(() => searchParams.get("dateFrom") ?? "");
  const [dateTo, setDateTo] = useState(() => searchParams.get("dateTo") ?? "");
  const [rowsPerPage, setRowsPerPage] = useState(() => String(pagination.pageSize || PAGINATION.defaultSecurityLogPageSize));

  const stats = useMemo(() => {
    const success = logs.filter((log) => log.status === "SUCCESS").length;
    const failed = logs.filter((log) => log.status === "FAILED").length;
    return { success, failed };
  }, [logs]);

  const buildPageUrl = (page: number, pageSize = rowsPerPage) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("pageSize", pageSize);
    if (search) params.set("search", search);
    if (eventType) params.set("eventType", eventType);
    if (status !== "all") params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return `${ROUTES.securityLog}?${params.toString()}`;
  };

  const handleFilter = () => {
    window.location.href = buildPageUrl(PAGINATION.defaultPage);
  };

  const handleResetFilter = () => {
    window.location.href = `${ROUTES.securityLog}?pageSize=${rowsPerPage}`;
  };

  const handleRowsPerPageChange = (value: string | null) => {
    const nextPageSize = value ?? rowsPerPage;
    setRowsPerPage(nextPageSize);
    window.location.href = buildPageUrl(PAGINATION.defaultPage, nextPageSize);
  };

  const renderPaginationItems = () => {
    const items = [];
    const { page, totalPages } = pagination;

    for (let item = 1; item <= totalPages; item += 1) {
      if (item === 1 || item === totalPages || (item >= page - 1 && item <= page + 1)) {
        items.push(
          <PaginationItem key={item}>
            <PaginationLink href={buildPageUrl(item)} isActive={item === page}>
              {item}
            </PaginationLink>
          </PaginationItem>,
        );
      } else if (item === page - 2 || item === page + 2) {
        items.push(
          <PaginationItem key={item}>
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }
    }

    return items;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit"
        title="Keamanan"
        description="Pantau audit log aktivitas penting, perubahan data, akses sistem, dan tindakan sensitif."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={Activity} label="Total log" value={pagination.totalItems.toString()} />
        <SummaryCard icon={CheckCircle2} label="Berhasil di halaman ini" value={stats.success.toString()} />
        <SummaryCard icon={AlertTriangle} label="Gagal di halaman ini" value={stats.failed.toString()} />
      </div>

      <Card className="border-muted-foreground/10 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="size-5" />
            Filter Audit Log
          </CardTitle>
          <CardDescription>Cari berdasarkan aktor, event, resource, status, atau rentang tanggal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px_170px_150px_150px_auto] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="security-search">Cari</Label>
              <Input
                id="security-search"
                className="h-9"
                placeholder="Nama, event, resource..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleFilter()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-type">Event</Label>
              <Input
                id="event-type"
                className="h-9"
                placeholder="LOGIN, UPDATE..."
                value={eventType}
                onChange={(event) => setEventType(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleFilter()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="security-status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
                <SelectTrigger id="security-status" className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-from">Dari</Label>
              <Input id="date-from" className="h-9" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">Sampai</Label>
              <Input id="date-to" className="h-9" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
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
              <ShieldCheck className="size-5" />
              Audit Log
            </CardTitle>
            <CardDescription>
              Total {pagination.totalItems} log - Halaman {pagination.page} dari {pagination.totalPages || 1}
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
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Aktor</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="font-medium">{formatDate(log.timestamp)}</div>
                      <div className="text-xs text-muted-foreground">{formatTime(log.timestamp)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{log.actorName}</div>
                      <div className="text-xs text-muted-foreground">{ROLE_LABELS[log.actorRole as keyof typeof ROLE_LABELS] ?? log.actorRole}</div>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 text-xs font-medium">{log.eventType}</code>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[280px] truncate" title={log.resource}>
                        {log.resource}
                      </div>
                    </TableCell>
                    <TableCell>{log.ipAddress || "-"}</TableCell>
                    <TableCell>
                      <StatusBadge status={log.status} />
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Tidak ada audit log yang cocok dengan filter.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 ? (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={buildPageUrl(Math.max(1, pagination.page - 1))}
                    text="Sebelumnya"
                    aria-disabled={!pagination.hasPreviousPage}
                  />
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                  <PaginationNext
                    href={buildPageUrl(Math.min(pagination.totalPages, pagination.page + 1))}
                    text="Berikutnya"
                    aria-disabled={!pagination.hasNextPage}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardDescription>{label}</CardDescription>
          <Icon className="size-4 text-primary" />
        </div>
        <CardTitle className="text-xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "SUCCESS") {
    return <Badge>Berhasil</Badge>;
  }

  if (status === "FAILED") {
    return <Badge variant="destructive">Gagal</Badge>;
  }

  return <Badge variant="outline">{status}</Badge>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMATS.date).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMATS.time).format(new Date(value));
}
