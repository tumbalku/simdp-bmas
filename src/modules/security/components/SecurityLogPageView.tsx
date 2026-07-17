"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  ShieldCheck,
} from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { DataTableCard } from "@/components/shared/DataTableCard";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { PaginationItems } from "@/components/shared/PaginationItems";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
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

const ACTOR_OPTIONS = [
  { value: "all", label: "Semua aktor" },
  { value: "ADMIN", label: ROLE_LABELS.ADMIN },
  { value: "STAFF", label: ROLE_LABELS.STAFF },
  { value: "EMPLOYEE", label: ROLE_LABELS.EMPLOYEE },
  { value: "Public", label: "Publik" },
  { value: "System", label: "Sistem" },
] as const;

const EVENT_OPTIONS = [
  { value: "all", label: "Semua event" },
  { value: "AUTH_LOGIN_SUCCESS", label: "Login berhasil" },
  { value: "AUTH_LOGIN_FAILED", label: "Login gagal" },
  { value: "AUTH_LOGOUT", label: "Logout" },
  { value: "AUTH_PASSWORD_CHANGED", label: "Password diubah" },
  { value: "DOCUMENT_UPLOADED", label: "Dokumen diunggah" },
  { value: "DOCUMENT_DOWNLOADED", label: "Dokumen diunduh" },
  { value: "DOCUMENT_DELETED", label: "Dokumen diarsipkan" },
  { value: "DOCUMENT_RESTORED", label: "Dokumen dipulihkan" },
  { value: "DOCUMENT_PERMANENTLY_DELETED", label: "Dokumen dihapus permanen" },
  { value: "EMPLOYEE_CREATED", label: "Pegawai dibuat" },
  { value: "EMPLOYEE_UPDATED", label: "Pegawai diperbarui" },
  { value: "EMPLOYEE_EXPORTED", label: "Data pegawai diekspor" },
  { value: "MASTER_DATA_CREATED", label: "Master data dibuat" },
  { value: "MASTER_DATA_UPDATED", label: "Master data diperbarui" },
  { value: "MASTER_DATA_DELETED", label: "Master data dihapus" },
  { value: "CRON_DOCUMENT_EXPIRED", label: "Dokumen kedaluwarsa" },
  { value: "CRON_CHECK_EXPIRY_RUN", label: "Cek kedaluwarsa berjalan" },
] as const;

export function SecurityLogPageView({ logs, pagination }: SecurityLogPageViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [actorRole, setActorRole] = useState(() => searchParams.get("actorRole") ?? "all");
  const [eventType, setEventType] = useState(() => searchParams.get("eventType") ?? "all");
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "all");
  const [dateFrom, setDateFrom] = useState(() => searchParams.get("dateFrom") ?? "");
  const [dateTo, setDateTo] = useState(() => searchParams.get("dateTo") ?? "");
  const [rowsPerPage, setRowsPerPage] = useState(() => String(pagination.pageSize || PAGINATION.defaultSecurityLogPageSize));

  const stats = useMemo(() => {
    const success = logs.filter((log) => log.status === "SUCCESS").length;
    const failed = logs.filter((log) => log.status === "FAILED").length;
    return { success, failed };
  }, [logs]);

  const buildPageUrl = (
    page: number,
    pageSize = rowsPerPage,
    nextActorRole = actorRole,
    nextEventType = eventType,
    nextStatus = status,
    nextDateFrom = dateFrom,
    nextDateTo = dateTo,
  ) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("pageSize", pageSize);
    if (nextActorRole !== "all") params.set("actorRole", nextActorRole);
    if (nextEventType !== "all") params.set("eventType", nextEventType);
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (nextDateFrom) params.set("dateFrom", nextDateFrom);
    if (nextDateTo) params.set("dateTo", nextDateTo);
    return `${ROUTES.securityLog}?${params.toString()}`;
  };

  const applyFilters = ({
    nextPage = PAGINATION.defaultPage,
    nextRowsPerPage = rowsPerPage,
    nextActorRole = actorRole,
    nextEventType = eventType,
    nextStatus = status,
    nextDateFrom = dateFrom,
    nextDateTo = dateTo,
  }: {
    nextPage?: number;
    nextRowsPerPage?: string;
    nextActorRole?: string;
    nextEventType?: string;
    nextStatus?: string;
    nextDateFrom?: string;
    nextDateTo?: string;
  } = {}) => {
    setActorRole(nextActorRole);
    setEventType(nextEventType);
    setStatus(nextStatus);
    setDateFrom(nextDateFrom);
    setDateTo(nextDateTo);
    setRowsPerPage(nextRowsPerPage);
    router.push(buildPageUrl(nextPage, nextRowsPerPage, nextActorRole, nextEventType, nextStatus, nextDateFrom, nextDateTo));
  };

  const handleFilter = () => applyFilters();

  const handleResetFilter = () => {
    applyFilters({
      nextPage: PAGINATION.defaultPage,
      nextRowsPerPage: String(PAGINATION.defaultSecurityLogPageSize),
      nextActorRole: "all",
      nextEventType: "all",
      nextStatus: "all",
      nextDateFrom: "",
      nextDateTo: "",
    });
  };

  const handleRowsPerPageChange = (value: string | null) => {
    applyFilters({
      nextPage: PAGINATION.defaultPage,
      nextRowsPerPage: value ?? String(PAGINATION.defaultSecurityLogPageSize),
    });
  };

  const columns: DataTableColumn<SecurityLogItem>[] = [
    {
      key: "timestamp",
      header: "Waktu",
      headClassName: "w-[170px]",
      cell: (log) => (
        <div className="space-y-0.5">
          <div className="font-medium">{formatDate(log.timestamp)}</div>
          <div className="text-xs text-muted-foreground">{formatTime(log.timestamp)}</div>
        </div>
      ),
    },
    {
      key: "actor",
      header: "Aktor",
      headClassName: "w-[220px]",
      cell: (log) => (
        <div className="space-y-0.5">
          <div className="font-medium">{log.actorName}</div>
          <div className="text-xs text-muted-foreground">
            {ROLE_LABELS[log.actorRole as keyof typeof ROLE_LABELS] ?? log.actorRole}
          </div>
        </div>
      ),
    },
    {
      key: "event",
      header: "Event",
      cell: (log) => <code className="rounded bg-muted px-2 py-1 text-xs font-medium">{log.eventType}</code>,
    },
    {
      key: "resource",
      header: "Resource",
      cell: (log) => (
        <div className="max-w-[280px] truncate" title={log.resource}>
          {log.resource}
        </div>
      ),
    },
    {
      key: "ipAddress",
      header: "IP",
      headClassName: "hidden md:table-cell",
      cellClassName: "hidden md:table-cell",
      cell: (log) => log.ipAddress || "-",
    },
    {
      key: "status",
      header: "Status",
      headClassName: "text-right",
      cellClassName: "text-right",
      cell: (log) => <StatusBadge status={log.status} />,
    },
  ];

  const paginationFooter = (
    <p className="text-xs text-muted-foreground">
      Menampilkan {logs.length} dari {pagination.totalItems} log.
    </p>
  );

  const paginationControls =
    pagination.totalPages > 1 ? (
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          {pagination.hasPreviousPage ? (
            <PaginationItem>
              <PaginationPrevious href={buildPageUrl(Math.max(1, pagination.page - 1))} />
            </PaginationItem>
          ) : null}
          <PaginationItems page={pagination.page} totalPages={pagination.totalPages} getHref={buildPageUrl} />
          {pagination.hasNextPage ? (
            <PaginationItem>
              <PaginationNext href={buildPageUrl(Math.min(pagination.totalPages, pagination.page + 1))} />
            </PaginationItem>
          ) : null}
        </PaginationContent>
      </Pagination>
    ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit"
        title="Keamanan"
        description="Pantau audit log aktivitas penting, perubahan data, akses sistem, dan tindakan sensitif."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          title="Total log"
          value={pagination.totalItems.toString()}
          description="Semua audit log sesuai filter aktif."
          icon={Activity}
          iconClassName="bg-primary/10 text-primary"
        />
        <MetricCard
          title="Berhasil"
          value={stats.success.toString()}
          description="Log berhasil pada halaman ini."
          icon={CheckCircle2}
          iconClassName="bg-success/10 text-success"
        />
        <MetricCard
          title="Gagal"
          value={stats.failed.toString()}
          description="Log gagal pada halaman ini."
          icon={AlertTriangle}
          iconClassName="bg-destructive/10 text-destructive"
        />
      </div>

      <Card className="border-muted-foreground/10 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="size-4" />
            Filter & Pencarian
          </CardTitle>
          <CardDescription>Saring berdasarkan aktor, event, status, dan rentang tanggal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-[minmax(150px,0.9fr)_minmax(190px,1.1fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_auto] lg:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="actor-role">Aktor</Label>
              <Select value={actorRole} onValueChange={(value) => setActorRole(value ?? "all")}>
                <SelectTrigger id="actor-role" className="w-full">
                  <SelectValue placeholder="Semua aktor" />
                </SelectTrigger>
                <SelectContent>
                  {ACTOR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-type">Event</Label>
              <Select value={eventType} onValueChange={(value) => setEventType(value ?? "all")}>
                <SelectTrigger id="event-type" className="w-full">
                  <SelectValue placeholder="Semua event" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="security-status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
                <SelectTrigger id="security-status" className="w-full">
                  <SelectValue placeholder="Semua status" />
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
            <div className="space-y-1.5">
              <Label htmlFor="date-from">Dari tanggal</Label>
              <Input id="date-from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date-to">Sampai tanggal</Label>
              <Input id="date-to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
              <Button type="button" className="gap-2" onClick={handleFilter}>
                <Search className="size-4" />
                Terapkan
              </Button>
              <Button type="button" variant="outline" onClick={handleResetFilter}>
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTableCard
        title="Audit Log"
        icon={<ShieldCheck className="size-5" />}
        description={`Total ${pagination.totalItems} log · Halaman ${pagination.page} dari ${pagination.totalPages || 1}`}
        rowsPerPageControl={{
          value: rowsPerPage,
          onValueChange: handleRowsPerPageChange,
          options: PAGINATION.pageSizeOptions,
          label: "Tampilkan",
          suffix: "row",
        }}
        tableMinWidthClassName="min-w-[900px]"
        table={
          <DataTable
            data={logs}
            columns={columns}
            getRowKey={(log) => log.id}
            headerClassName="bg-muted/20"
            emptyMessage="Tidak ada audit log yang cocok dengan filter."
          />
        }
        footerSummary={paginationFooter}
        pagination={paginationControls}
      />
    </div>
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
