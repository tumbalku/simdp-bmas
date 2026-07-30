import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PAGINATION } from "@/constants";
import { requireAuth } from "@/lib/auth";
import { getAvailableDocumentTypes } from "@/modules/document/server";
import { getVerificationQueue } from "@/modules/verification/server";
import { VerificationQueueView } from "@/modules/verification/components/VerificationQueueView";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    documentTypeId?: string;
    archiveCategory?: string;
  }>;
};

export default async function VerificationPage({ searchParams }: PageProps) {
  const session = await requireAuth("STAFF");

  const params = await searchParams;
  const page = params?.page ? parseInt(params.page, 10) : PAGINATION.defaultPage;
  const pageSize = params?.limit
    ? parseInt(params.limit, 10)
    : PAGINATION.defaultPageSize;

  const [queueResult, documentTypes] = await Promise.all([
    getVerificationQueue({
      page,
      pageSize,
      search: params?.search,
      documentTypeId: params?.documentTypeId,
      archiveCategory: params?.archiveCategory,
    }),
    getAvailableDocumentTypes(session),
  ]);

  if (!queueResult) {
    return (
      <Alert variant="destructive" className="my-6">
        <AlertCircle className="size-4" />
        <AlertTitle>Gagal Memuat Antrian</AlertTitle>
        <AlertDescription>
          Terjadi kesalahan saat memuat data verifikasi.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <VerificationQueueView
      initialData={queueResult.data}
      initialPagination={queueResult.meta.pagination}
      documentTypes={documentTypes}
    />
  );
}
