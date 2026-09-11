"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Search, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/navigation/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { DataTableCard } from "@/components/tables/DataTableCard";
import { DocumentFilterCard } from "@/components/tables/DocumentFilterCard";
import { PaginationItems } from "@/components/tables/PaginationItems";
import { RowsPerPageControl } from "@/components/tables/RowsPerPageControl";
import { ViewModeToggle } from "@/components/tables/ViewModeToggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { PAGINATION, ROUTES } from "@/constants";
import type {
  RegistrationRequestListItem,
  RegistrationRequestListResult,
} from "../service";
import {
  approveRegistrationRequestAction,
  rejectRegistrationRequestAction,
} from "../actions";
import { RegistrationReviewDialog } from "./RegistrationReviewDialog";

type RegistrationRequestsAdminPageProps = {
  requests: RegistrationRequestListItem[];
  pendingCount: number;
  pagination: RegistrationRequestListResult["pagination"];
  search?: string;
  storageError?: string;
};

function formatRegistrationDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function RegistrationRequestsAdminPage({
  requests,
  pendingCount,
  pagination,
  search,
  storageError,
}: RegistrationRequestsAdminPageProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [searchInput, setSearchInput] = useState(search ?? "");
  const [selectedRequest, setSelectedRequest] =
    useState<RegistrationRequestListItem | null>(null);
  const [isNavigating, startNavigation] = useTransition();
  const [isReviewing, startReview] = useTransition();
  const viewMode = params.get("view") === "grid" ? "grid" : "list";

  function buildUrl(
    next: {
      page?: number;
      search?: string;
      limit?: number;
      view?: string;
    } = {},
  ) {
    const query = new URLSearchParams();
    query.set("page", String(next.page ?? pagination.page));
    query.set("limit", String(next.limit ?? pagination.pageSize));
    const nextSearch = (next.search ?? search ?? "").trim();
    if (nextSearch) query.set("search", nextSearch);
    if ((next.view ?? viewMode) === "grid") query.set("view", "grid");
    return `${ROUTES.registrationRequests}?${query.toString()}`;
  }

  function navigate(next: Parameters<typeof buildUrl>[0]) {
    startNavigation(() => router.push(buildUrl(next), { scroll: false }));
  }

  function handleReview(action: "approve" | "reject") {
    if (!selectedRequest || isReviewing) return;
    startReview(async () => {
      try {
        const input = { id: selectedRequest.id };
        const result =
          action === "approve"
            ? await approveRegistrationRequestAction(input)
            : await rejectRegistrationRequestAction(input);
        if (!result.ok) {
          toast.error(result.error.message);
          return;
        }
        if (action === "approve" && "emailDelivery" in result.data) {
          if (result.data.emailDelivery === "FAILED") {
            toast.warning(
              "Registrasi disetujui dan akun dibuat, tetapi email pemberitahuan gagal dikirim. Hubungi pendaftar dan periksa layanan email.",
              { duration: 10000 },
            );
          } else {
            toast.success(
              "Registrasi disetujui, akun dibuat, dan email pemberitahuan dikirim.",
            );
          }
        } else {
          toast.success("Registrasi ditolak.");
        }
        setSelectedRequest(null);
        if (requests.length === 1 && pagination.page > 1)
          navigate({ page: pagination.page - 1 });
        else router.refresh();
      } catch {
        toast.error(
          "Keputusan belum dapat diproses. Muat ulang halaman untuk memeriksa status registrasi.",
        );
      }
    });
  }

  function reviewButton(request: RegistrationRequestListItem) {
    return (
      <Button
        size="xs"
        disabled={isReviewing}
        onClick={() => {
          setSelectedRequest(request);
        }}
      >
        <Search className="size-3" />
        Tinjau Registrasi
      </Button>
    );
  }

  const columns: DataTableColumn<RegistrationRequestListItem>[] = [
    {
      key: "name",
      header: "Pendaftar",
      cell: (request) => (
        <div className="space-y-0.5">
          <p className="font-medium">{request.name}</p>
          <p className="text-xs text-muted-foreground">{request.email}</p>
        </div>
      ),
    },
    {
      key: "identity",
      header: "NIK / NIP",
      cell: (request) => (
        <div className="space-y-0.5 text-xs">
          {request.nik && <p>NIK: {request.nik}</p>}
          {request.employeeId && <p>NIP: {request.employeeId}</p>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: () => (
        <Badge variant="secondary" className="font-normal">
          Menunggu verifikasi
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Mendaftar",
      cellClassName: "whitespace-nowrap text-muted-foreground",
      cell: (request) => formatRegistrationDate(request.createdAt),
    },
    {
      key: "action",
      header: "Aksi",
      headClassName: "text-right",
      cell: (request) => (
        <div className="flex justify-end">{reviewButton(request)}</div>
      ),
    },
  ];
  const rowsControl = {
    value: String(pagination.pageSize),
    onValueChange: (value: string | null) =>
      navigate({ page: 1, limit: Number(value ?? PAGINATION.defaultPageSize) }),
    options: PAGINATION.pageSizeOptions,
  };
  const footerSummary = (
    <p className="text-xs text-muted-foreground">
      Menampilkan {requests.length} dari {pagination.total} registrasi. Total
      menunggu verifikasi: {pendingCount}.
    </p>
  );
  const paginationControls =
    pagination.totalPages > 1 ? (
      <Pagination className="sm:ml-auto sm:w-auto">
        <PaginationContent>
          {pagination.page > 1 && (
            <PaginationItem>
              <PaginationPrevious
                href={buildUrl({ page: pagination.page - 1 })}
                onClick={(event) => {
                  event.preventDefault();
                  navigate({ page: pagination.page - 1 });
                }}
              />
            </PaginationItem>
          )}
          <PaginationItems
            page={pagination.page}
            totalPages={pagination.totalPages}
            getHref={(page) => buildUrl({ page })}
            onPageClick={(event, page) => {
              event.preventDefault();
              navigate({ page });
            }}
          />
          {pagination.page < pagination.totalPages && (
            <PaginationItem>
              <PaginationNext
                href={buildUrl({ page: pagination.page + 1 })}
                onClick={(event) => {
                  event.preventDefault();
                  navigate({ page: pagination.page + 1 });
                }}
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master Data"
        title="Registrasi User"
        description="Tinjau pendaftar yang sudah memverifikasi email dan menunggu persetujuan admin."
      />
      {storageError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{storageError}</AlertDescription>
        </Alert>
      )}
      <DocumentFilterCard
        description="Cari berdasarkan nama, email, NIK, atau NIP."
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Cari pendaftar..."
        onApply={() => navigate({ page: 1, search: searchInput })}
        onReset={() => {
          setSearchInput("");
          navigate({ page: 1, search: "", limit: PAGINATION.defaultPageSize });
        }}
      />
      <ViewModeToggle
        value={viewMode}
        onValueChange={(view) => navigate({ view })}
        leading={
          viewMode === "grid" ? (
            <RowsPerPageControl {...rowsControl} />
          ) : undefined
        }
      />
      {isNavigating ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : !storageError && requests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-[280px] items-center justify-center text-center">
            <div className="max-w-md space-y-3">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10">
                {search ? (
                  <Search className="size-7 text-muted-foreground" />
                ) : (
                  <CheckCircle2 className="size-7 text-success" />
                )}
              </div>
              <p className="text-base font-semibold">
                {search ? "Tidak ada hasil" : "Semua Selesai!"}
              </p>
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Coba ubah kata kunci pencarian."
                  : "Tidak ada registrasi yang menunggu verifikasi saat ini."}
              </p>
              {pagination.page > 1 && (
                <Button variant="outline" onClick={() => navigate({ page: 1 })}>
                  Kembali ke halaman pertama
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : storageError ? null : viewMode === "list" ? (
        <DataTableCard
          title="Daftar Tunggu"
          icon={<UserCheck className="size-5" />}
          description="Buka tinjauan registrasi untuk memeriksa data dan mengambil keputusan verifikasi."
          rowsPerPageControl={rowsControl}
          tableMinWidthClassName="min-w-[760px]"
          table={
            <DataTable
              data={requests}
              columns={columns}
              getRowKey={(request) => request.id}
              headerClassName="bg-muted/20"
            />
          }
          footerSummary={footerSummary}
          pagination={paginationControls}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {requests.map((request) => (
              <Card
                key={request.id}
                className="border-muted-foreground/10 shadow-sm"
              >
                <CardContent className="space-y-3 p-4">
                  <div className="space-y-0.5">
                    <p className="truncate font-medium">{request.name}</p>
                    <p className="break-all text-xs text-muted-foreground">
                      {request.email}
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-normal">
                    Menunggu verifikasi
                  </Badge>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {request.nik && <p>NIK: {request.nik}</p>}
                    {request.employeeId && <p>NIP: {request.employeeId}</p>}
                    <p>Mendaftar {formatRegistrationDate(request.createdAt)}</p>
                  </div>
                  <div className="flex justify-end border-t pt-3">
                    {reviewButton(request)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {footerSummary}
            {paginationControls}
          </div>
        </div>
      )}
      <RegistrationReviewDialog
        request={selectedRequest}
        isPending={isReviewing}
        onClose={() => setSelectedRequest(null)}
        onReview={handleReview}
      />
    </div>
  );
}

