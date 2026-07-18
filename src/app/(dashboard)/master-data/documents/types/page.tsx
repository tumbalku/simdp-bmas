import { PAGINATION } from "@/constants";
import { requireAuth } from "@/lib/auth";
import { DocumentTypesPageView } from "@/modules/document/components/DocumentTypesPageView";
import { getDocumentTypesWithPagination } from "@/modules/document/server";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    archiveCategory?: string;
    search?: string;
  }>;
};

const archiveCategories = ["PERSONAL", "EDUCATION", "EMPLOYMENT", "CERTIFICATION", "LEGAL"] as const;
type ArchiveCategory = (typeof archiveCategories)[number];

function parseArchiveCategory(value?: string): ArchiveCategory | undefined {
  return archiveCategories.includes(value as ArchiveCategory) ? (value as ArchiveCategory) : undefined;
}

export default async function DocumentTypesPage({ searchParams }: PageProps) {
  await requireAuth("ADMIN");

  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : PAGINATION.defaultPage;
  const limit = params.limit ? parseInt(params.limit, 10) : PAGINATION.defaultPageSize;
  const archiveCategory = parseArchiveCategory(params.archiveCategory);
  const search = params.search;

  const result = await getDocumentTypesWithPagination({
    page,
    limit,
    archiveCategory,
    search,
  });

  return <DocumentTypesPageView documentTypes={result.data} pagination={result.pagination} />;
}
