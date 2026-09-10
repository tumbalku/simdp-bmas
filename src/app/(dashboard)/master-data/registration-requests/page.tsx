import { z } from "zod";
import { requireDashboardRole } from "@/lib/dashboard-auth";
import {
  getRegistrationSchemaMissingMessage,
  isRegistrationSchemaMissingError,
} from "@/lib/errors";
import { PAGINATION } from "@/constants";
import { REGISTRATION_STATUS } from "@/modules/registration";
import { RegistrationRequestsAdminPage } from "@/modules/registration/components/RegistrationRequestsAdminPage";
import { listRegistrationRequests } from "@/modules/registration/server";

export const dynamic = "force-dynamic";

const queueParamsSchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce
    .number()
    .int()
    .positive()
    .max(1_000_000)
    .catch(PAGINATION.defaultPage),
  limit: z.coerce
    .number()
    .int()
    .refine((value) =>
      PAGINATION.pageSizeOptions.some((option) => option === value),
    )
    .catch(PAGINATION.defaultPageSize),
});

type PageProps = {
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

export default async function RegistrationRequestsPage({
  searchParams,
}: PageProps) {
  await requireDashboardRole("ADMIN");
  const params = queueParamsSchema.parse(await searchParams);
  try {
    const result = await listRegistrationRequests({
      ...params,
      status: REGISTRATION_STATUS.PENDING_ADMIN_REVIEW,
    });
    return (
      <RegistrationRequestsAdminPage
        key={`${params.search ?? ""}:${result.pagination.page}`}
        requests={result.data}
        pendingCount={result.pendingCount}
        pagination={result.pagination}
        search={params.search}
      />
    );
  } catch (error) {
    if (!isRegistrationSchemaMissingError(error)) throw error;
    return (
      <RegistrationRequestsAdminPage
        requests={[]}
        pendingCount={0}
        pagination={{
          page: params.page,
          pageSize: params.limit,
          total: 0,
          totalPages: 1,
        }}
        search={params.search}
        storageError={getRegistrationSchemaMissingMessage()}
      />
    );
  }
}
