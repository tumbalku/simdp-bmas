import { requireAuth } from "@/lib/auth";
import { getDocumentRecordsWithPagination } from "@/modules/document/service";
import { MasterDataDocumentsView } from "@/modules/document/components/MasterDataDocumentsView";
import { PAGINATION } from "@/constants";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    archiveView?: string;
    status?: string;
    search?: string;
  }>;
};

export default async function MasterDataDocumentsPage({ searchParams }: PageProps) {
  await requireAuth("ADMIN");

  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : PAGINATION.defaultPage;
  const limit = params.limit ? parseInt(params.limit, 10) : PAGINATION.defaultPageSize;
  const archiveView = params.archiveView === "archived" ? "archived" : "active";
  const status = params.status as "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "REPLACED" | undefined;
  const search = params.search;

  const result = await getDocumentRecordsWithPagination({
    page,
    limit,
    archiveView,
    status,
    search,
  });

  return <MasterDataDocumentsView documents={result.data} pagination={result.pagination} archiveView={archiveView} />;
}
