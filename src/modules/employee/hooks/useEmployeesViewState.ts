"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PAGINATION, ROUTES } from "@/constants";
import type { EmployeeDirectoryFilterValues } from "../types/filter.types";

import { type ViewMode } from "@/components/tables/ViewModeToggle";

export type OfficialForm = {
  employeeId: string;
  name: string;
  position: string;
  rank: string;
  nip: string;
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

export type UseEmployeesViewStateProps = {
  paginationLimit: number;
  paginationPage: number;
  archiveView: "active" | "archived";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export function useEmployeesViewState({
  paginationLimit,
  paginationPage,
  archiveView,
  sortBy,
  sortOrder,
}: UseEmployeesViewStateProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [filters, setFilters] = useState(() => getInitialFilterValues(searchParams));
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    String(paginationLimit || PAGINATION.defaultPageSize),
  );
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    searchParams.get("view") === "grid" ? "grid" : "list",
  );

  const isArchiveView = archiveView === "archived";

  useEffect(() => {
    setSelectedEmployeeIds([]);
  }, [isArchiveView]);

  const buildPageUrl = (
    page: number,
    nextFilters = filters,
    limit = rowsPerPage,
    nextViewMode = viewMode,
  ) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit);
    if (isArchiveView) params.set("archiveView", "archived");
    if (nextViewMode === "grid") params.set("view", "grid");
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);

    FILTER_KEYS.forEach((key) => {
      const value = nextFilters[key].trim();
      if (value) params.set(key, value);
    });

    return `${ROUTES.masterDataEmployees}?${params.toString()}`;
  };

  const buildArchiveViewUrl = (nextArchiveView: "active" | "archived") => {
    const params = new URLSearchParams();
    params.set("page", String(PAGINATION.defaultPage));
    params.set("limit", rowsPerPage);
    if (nextArchiveView === "archived") params.set("archiveView", "archived");
    if (viewMode === "grid") params.set("view", "grid");
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);

    FILTER_KEYS.forEach((key) => {
      const value = filters[key].trim();
      if (value) params.set(key, value);
    });

    return `${ROUTES.masterDataEmployees}?${params.toString()}`;
  };

  const buildExportUrl = () => {
    const params = new URLSearchParams();
    if (isArchiveView) params.set("archiveView", "archived");

    FILTER_KEYS.forEach((key) => {
      const value = filters[key].trim();
      if (value) params.set(key, value);
    });

    const query = params.toString();
    return `/api/v1/employees/export${query ? `?${query}` : ""}`;
  };

  const buildExportPdfUrl = (official: OfficialForm) => {
    const params = new URLSearchParams();
    if (isArchiveView) params.set("archiveView", "archived");

    FILTER_KEYS.forEach((key) => {
      const value = filters[key].trim();
      if (value) params.set(key, value);
    });

    params.set("officialName", official.name.trim());
    params.set("officialPosition", official.position.trim());
    params.set("officialRank", official.rank.trim());
    params.set("officialNip", official.nip.trim());

    const query = params.toString();
    return `/api/v1/employees/export-pdf${query ? `?${query}` : ""}`;
  };

  const handleSortChange = (
    nextSortBy: string,
    nextSortOrder: "asc" | "desc",
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", nextSortBy);
    params.set("sortOrder", nextSortOrder);
    params.set("page", "1");
    router.push(`${ROUTES.masterDataEmployees}?${params.toString()}`);
  };

  const handleValueChange = (
    key: keyof EmployeeDirectoryFilterValues,
    value: string,
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleFilter = () => {
    router.push(buildPageUrl(PAGINATION.defaultPage));
  };

  const handleViewModeChange = (nextViewMode: ViewMode) => {
    setViewMode(nextViewMode);
    window.history.replaceState(
      null,
      "",
      buildPageUrl(paginationPage, filters, rowsPerPage, nextViewMode),
    );
  };

  const handleRowsPerPageChange = (value: string | null) => {
    const nextLimit = value ?? rowsPerPage;
    setRowsPerPage(nextLimit);
    router.push(buildPageUrl(PAGINATION.defaultPage, filters, nextLimit));
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
    const defaultLimit = String(PAGINATION.defaultPageSize);
    setRowsPerPage(defaultLimit);
    router.push(buildPageUrl(PAGINATION.defaultPage, resetFilters, defaultLimit));
  };

  const buildExportPdfPageUrl = () => {
    const params = new URLSearchParams();
    if (isArchiveView) params.set("archiveView", "archived");

    FILTER_KEYS.forEach((key) => {
      const value = filters[key].trim();
      if (value) params.set(key, value);
    });

    const query = params.toString();
    return `/master-data/employees/export${query ? `?${query}` : ""}`;
  };

  return {
    selectedEmployeeIds,
    setSelectedEmployeeIds,
    filters,
    rowsPerPage,
    viewMode,
    isArchiveView,
    buildPageUrl,
    buildArchiveViewUrl,
    buildExportUrl,
    buildExportPdfUrl,
    buildExportPdfPageUrl,
    handleSortChange,
    handleValueChange,
    handleFilter,
    handleViewModeChange,
    handleRowsPerPageChange,
    handleResetFilter,
  };
}
