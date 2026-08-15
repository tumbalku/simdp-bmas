"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { DataTableCard } from "@/components/tables/DataTableCard";
import { PageHeader } from "@/components/navigation/PageHeader";
import { type PaginationMeta } from "@/types/pagination";
import { PaginationItems } from "@/components/tables/PaginationItems";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { DATE_FORMATS, DATE_LOCALE, PAGINATION, ROLE_LABELS, ROUTES } from "@/constants";
import {
  SECURITY_ACTOR_ROLE,
  SECURITY_ACTOR_ROLE_LABELS,
  SECURITY_EVENT_TYPE_LABELS,
  SECURITY_EVENT_TYPE_OPTIONS,
  SECURITY_LOG_STATUS,
  SECURITY_LOG_STATUS_LABELS,
} from "../constants";
import { SecurityLogFilterCard } from "./SecurityLogFilterCard";
import { SecurityLogMetrics } from "./SecurityLogMetrics";

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

type SecurityLogPageViewProps = {
  logs: SecurityLogItem[];
  pagination: PaginationMeta;
};

const STATUS_OPTIONS = [
  { value: "all", label: "Status" },
  ...Object.values(SECURITY_LOG_STATUS).map((value) => ({ value, label: SECURITY_LOG_STATUS_LABELS[value] })),
] as const;

const ACTOR_OPTIONS = [
  { value: "all", label: "Aktor" },
  ...Object.values(SECURITY_ACTOR_ROLE).map((value) => ({ value, label: SECURITY_ACTOR_ROLE_LABELS[value] })),
] as const;

const EVENT_OPTIONS = [
  { value: "all", label: "Event" },
  ...SECURITY_EVENT_TYPE_OPTIONS,
] as const;

export function SecurityLogPageView({ logs, pagination }: SecurityLogPageViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [actorRole, setActorRole] = useState(() => searchParams.get("actorRole") ?? "all");
  const [eventType, setEventType] = useState(() => searchParams.get("eventType") ?? "all");
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "all");
  const [dateFrom, setDateFrom] = useState(() => searchParams.get("dateFrom") ?? "");
  const [dateTo, setDateTo] = useState(() => searchParams.get("dateTo") ?? "");
  const [rowsPerPage, setRowsPerPage] = useState(() => String(pagination.pageSize || PAGINATION.defaultSecurityLogPageSize));

  const stats = useMemo(() => {
    const success = logs.filter((log) => log.status === SECURITY_LOG_STATUS.SUCCESS).length;
    const failed = logs.filter((log) => log.status === SECURITY_LOG_STATUS.FAILED).length;
    return { success, failed };
  }, [logs]);

  const buildPageUrl = (
    page: number,
    pageSize = rowsPerPage,
    nextSearch = search,
    nextActorRole = actorRole,
    nextEventType = eventType,
    nextStatus = status,
    nextDateFrom = dateFrom,
    nextDateTo = dateTo,
  ) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("pageSize", pageSize);
    if (nextSearch) params.set("search", nextSearch);
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
    nextSearch = search,
    nextActorRole = actorRole,
    nextEventType = eventType,
    nextStatus = status,
    nextDateFrom = dateFrom,
    nextDateTo = dateTo,
  }: {
    nextPage?: number;
    nextRowsPerPage?: string;
    nextSearch?: string;
    nextActorRole?: string;
    nextEventType?: string;
    nextStatus?: string;
    nextDateFrom?: string;
    nextDateTo?: string;
  } = {}) => {
    setSearch(nextSearch);
    setActorRole(nextActorRole);
    setEventType(nextEventType);
    setStatus(nextStatus);
    setDateFrom(nextDateFrom);
    setDateTo(nextDateTo);
    setRowsPerPage(nextRowsPerPage);
    router.push(buildPageUrl(nextPage, nextRowsPerPage, nextSearch, nextActorRole, nextEventType, nextStatus, nextDateFrom, nextDateTo));
  };

  const handleFilter = () => applyFilters();

  const handleResetFilter = () => {
    applyFilters({
      nextPage: PAGINATION.defaultPage,
      nextRowsPerPage: String(PAGINATION.defaultSecurityLogPageSize),
      nextSearch: "",
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
            {SECURITY_ACTOR_ROLE_LABELS[log.actorRole as keyof typeof SECURITY_ACTOR_ROLE_LABELS] ??
              ROLE_LABELS[log.actorRole as keyof typeof ROLE_LABELS] ??
              log.actorRole}
          </div>
        </div>
      ),
    },
    {
      key: "event",
      header: "Event",
      cell: (log) => (
        <code className="rounded bg-muted px-2 py-1 text-xs font-medium">
          {SECURITY_EVENT_TYPE_LABELS[log.eventType as keyof typeof SECURITY_EVENT_TYPE_LABELS] ?? log.eventType}
        </code>
      ),
    },
    {
      key: "resource",
      header: "Resource",
      cell: (log) => (
        <div className="space-y-1">
          <div className="max-w-[280px] truncate" title={log.resource}>
            {log.resource}
          </div>
          <ReminderErrorBadge metadata={log.metadata} />
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

      <SecurityLogMetrics totalItems={pagination.totalItems} success={stats.success} failed={stats.failed} />

      <SecurityLogFilterCard
        actorRole={actorRole}
        setActorRole={setActorRole}
        eventType={eventType}
        setEventType={setEventType}
        status={status}
        setStatus={setStatus}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        actorOptions={ACTOR_OPTIONS}
        eventOptions={EVENT_OPTIONS}
        statusOptions={STATUS_OPTIONS}
        onApply={handleFilter}
        onReset={handleResetFilter}
      />

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
  if (status === SECURITY_LOG_STATUS.SUCCESS) {
    return <Badge>{SECURITY_LOG_STATUS_LABELS.SUCCESS}</Badge>;
  }

  if (status === SECURITY_LOG_STATUS.FAILED) {
    return <Badge variant="destructive">{SECURITY_LOG_STATUS_LABELS.FAILED}</Badge>;
  }

  return <Badge variant="outline">{status}</Badge>;
}

function ReminderErrorBadge({ metadata }: { metadata: unknown }) {
  const reminderErrorCount = getReminderErrorCount(metadata);
  if (reminderErrorCount === 0) return null;

  return <Badge variant="destructive">Reminder gagal: {reminderErrorCount}</Badge>;
}

function getReminderErrorCount(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return 0;
  const reminderErrors = (metadata as { reminderErrors?: unknown }).reminderErrors;
  return Array.isArray(reminderErrors) ? reminderErrors.length : 0;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMATS.date).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMATS.time).format(new Date(value));
}
