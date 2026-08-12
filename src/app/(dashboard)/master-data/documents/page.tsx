import { requireDashboardRole } from "@/lib/dashboard-auth";
import {
  getAvailableDocumentTypes,
  getDocumentRecordsWithPagination,
} from "@/modules/document/server";
import { MasterDataDocumentsView } from "@/modules/document/components/MasterDataDocumentsView";
import { PAGINATION } from "@/constants";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    archiveView?: string;
    search?: string;
    documentTypeId?: string;
    archiveCategory?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
};

const archiveCategories = [
  "PERSONAL",
  "EDUCATION",
  "EMPLOYMENT",
  "CERTIFICATION",
  "LEGAL",
] as const;

function parseArchiveCategory(value?: string) {
  return archiveCategories.includes(value as (typeof archiveCategories)[number])
    ? (value as (typeof archiveCategories)[number])
    : undefined;
}

function parseSortOrder(value?: string): "asc" | "desc" | undefined {
  if (value === "asc" || value === "desc") return value;
  return undefined;
}

export default async function MasterDataDocumentsPage({
  searchParams,
}: PageProps) {
  await requireDashboardRole("ADMIN");

  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : PAGINATION.defaultPage;
  const limit = params.limit
    ? parseInt(params.limit, 10)
    : PAGINATION.defaultPageSize;
  const archiveView = params.archiveView === "archived" ? "archived" : "active";
  const search = params.search;
  const documentTypeId = params.documentTypeId;
  const archiveCategory = parseArchiveCategory(params.archiveCategory);
  const sortBy = params.sortBy;
  const sortOrder = parseSortOrder(params.sortOrder);

  const [result, documentTypes] = await Promise.all([
    getDocumentRecordsWithPagination({
      page,
      limit,
      archiveView,
      search,
      documentTypeId,
      archiveCategory,
      sortBy,
      sortOrder,
    }),
    getAvailableDocumentTypes(),
  ]);

  return (
    <MasterDataDocumentsView
      documents={result.data}
      pagination={result.pagination}
      archiveView={archiveView}
      documentTypes={documentTypes}
      sortBy={sortBy}
      sortOrder={sortOrder}
    />
  );
}
