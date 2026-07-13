import { requireAuth } from "@/lib/auth";
import { getEmployeeDirectoryWithPagination } from "@/modules/employee/service";
import { MasterDataEmployeesView } from "@/modules/employee/components/MasterDataEmployeesView";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
  }>;
};

export default async function MasterDataEmployeesPage({ searchParams }: PageProps) {
  await requireAuth("ADMIN");

  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 20;
  const search = params.search;

  const result = await getEmployeeDirectoryWithPagination({
    page,
    limit,
    search,
  });

  return <MasterDataEmployeesView employees={result.data} pagination={result.pagination} />;
}
