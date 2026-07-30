import { redirect } from "next/navigation";

import { PAGINATION, ROUTES } from "@/constants";
import { requireAuth } from "@/lib/auth";
import { SecurityLogPageView } from "@/modules/security/components/SecurityLogPageView";
import { getSecurityLogs } from "@/modules/security/server";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    eventType?: string;
    actorRole?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

export default async function SecurityLogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  try {
    await requireAuth("ADMIN");
    const result = await getSecurityLogs({
      page: params.page ? parseInt(params.page, 10) : PAGINATION.defaultPage,
      pageSize: params.pageSize ? parseInt(params.pageSize, 10) : PAGINATION.defaultSecurityLogPageSize,
      search: params.search,
      eventType: params.eventType,
      actorRole: params.actorRole,
      status: params.status,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    });

    return (
      <SecurityLogPageView
        logs={result.data.map((log) => ({
          id: log.id,
          timestamp: log.timestamp.toISOString(),
          actorName: log.actorName,
          actorRole: log.actorRole,
          eventType: log.eventType,
          resource: log.resource,
          ipAddress: log.ipAddress,
          status: log.status,
          metadata: log.metadata,
        }))}
        pagination={result.meta.pagination}
      />
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "INTERNAL_ERROR";
    redirect(message === "FORBIDDEN" ? ROUTES.dashboard : ROUTES.login);
  }
}
