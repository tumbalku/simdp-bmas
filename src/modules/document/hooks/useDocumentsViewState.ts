"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PAGINATION, ROUTES } from "@/constants";

import { type ViewMode } from "@/components/tables/ViewModeToggle";

export type UseDocumentsViewStateProps = {
  paginationLimit: number;
  paginationPage: number;
  archiveView: "active" | "archived";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export function useDocumentsViewState({
  paginationLimit,
  paginationPage,
  archiveView,
  sortBy,
  sortOrder,
}: UseDocumentsViewStateProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [documentTypeId, setDocumentTypeId] = useState(
    () => searchParams.get("documentTypeId") ?? "",
  );
  const [archiveCategory, setArchiveCategory] = useState(
    () => searchParams.get("archiveCategory") ?? "",
  );
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    String(paginationLimit || PAGINATION.defaultPageSize),
  );
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    searchParams.get("view") === "grid" ? "grid" : "list",
  );

  const isArchiveView = archiveView === "archived";

  useEffect(() => {
    setSelectedDocIds([]);
  }, [isArchiveView]);

  const buildPageUrl = (
    page: number,
    limit = rowsPerPage,
    nextViewMode = viewMode,
  ) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit);
    if (isArchiveView) params.set("archiveView", "archived");
    if (search.trim()) params.set("search", search.trim());
    if (documentTypeId) params.set("documentTypeId", documentTypeId);
    if (archiveCategory) params.set("archiveCategory", archiveCategory);
    if (nextViewMode === "grid") params.set("view", nextViewMode);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);
    return `${ROUTES.masterDataDocuments}?${params.toString()}`;
  };

  const buildArchiveViewUrl = (nextArchiveView: "active" | "archived") => {
    const params = new URLSearchParams();
    params.set("page", String(PAGINATION.defaultPage));
    params.set("limit", rowsPerPage);
    if (nextArchiveView === "archived") params.set("archiveView", "archived");
    if (search.trim()) params.set("search", search.trim());
    if (documentTypeId) params.set("documentTypeId", documentTypeId);
    if (archiveCategory) params.set("archiveCategory", archiveCategory);
    if (viewMode === "grid") params.set("view", "grid");
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);
    return `${ROUTES.masterDataDocuments}?${params.toString()}`;
  };

  const handleSortChange = (
    nextSortBy: string,
    nextSortOrder: "asc" | "desc",
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", nextSortBy);
    params.set("sortOrder", nextSortOrder);
    params.set("page", "1");
    router.push(`${ROUTES.masterDataDocuments}?${params.toString()}`);
  };

  const buildExportPdfUrl = () => {
    const params = new URLSearchParams();
    if (isArchiveView) params.set("archiveView", "archived");
    if (search.trim()) params.set("search", search.trim());
    if (documentTypeId) params.set("documentTypeId", documentTypeId);
    if (archiveCategory) params.set("archiveCategory", archiveCategory);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);
    const query = params.toString();

    return `/api/v1/documents/export-pdf${query ? `?${query}` : ""}`;
  };

  const handleDocumentTypeChange = (value: string | null) => {
    setDocumentTypeId(!value || value === "all" ? "" : value);
  };

  const handleArchiveCategoryChange = (value: string | null) => {
    setArchiveCategory(!value || value === "all" ? "" : value);
  };

  const handleViewModeChange = (nextViewMode: ViewMode) => {
    setViewMode(nextViewMode);
    window.history.replaceState(
      null,
      "",
      buildPageUrl(paginationPage, rowsPerPage, nextViewMode),
    );
  };

  const handleFilter = () => {
    router.push(buildPageUrl(PAGINATION.defaultPage));
  };

  const handleRowsPerPageChange = (value: string | null) => {
    const nextLimit = value ?? rowsPerPage;
    setRowsPerPage(nextLimit);
    router.push(buildPageUrl(PAGINATION.defaultPage, nextLimit));
  };

  const handleResetFilter = () => {
    const defaultLimit = String(PAGINATION.defaultPageSize);
    setSearch("");
    setDocumentTypeId("");
    setArchiveCategory("");
    setRowsPerPage(defaultLimit);
    const params = new URLSearchParams();
    params.set("page", String(PAGINATION.defaultPage));
    params.set("limit", defaultLimit);
    if (isArchiveView) params.set("archiveView", "archived");
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);
    router.push(`${ROUTES.masterDataDocuments}?${params.toString()}`);
  };

  return {
    selectedDocIds,
    setSelectedDocIds,
    search,
    setSearch,
    documentTypeId,
    archiveCategory,
    rowsPerPage,
    viewMode,
    isArchiveView,
    buildPageUrl,
    buildArchiveViewUrl,
    buildExportPdfUrl,
    handleSortChange,
    handleDocumentTypeChange,
    handleArchiveCategoryChange,
    handleViewModeChange,
    handleFilter,
    handleRowsPerPageChange,
    handleResetFilter,
  };
}
