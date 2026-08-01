import { requireAuth } from "@/lib/auth";
import { getAvailableDocumentTypes, getDocumentRecordsForSession } from "@/modules/document/server";
import { DocumentsPageView } from "@/modules/document/components/DocumentsPageView";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    search?: string;
    documentTypeId?: string;
    archiveCategory?: "PERSONAL" | "EDUCATION" | "EMPLOYMENT" | "CERTIFICATION" | "LEGAL";
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const session = await requireAuth();
  const params = await searchParams;

  const [documents, allDocuments, documentTypes] = await Promise.all([
    getDocumentRecordsForSession(session, {
      search: params?.search,
      documentTypeId: params?.documentTypeId,
      archiveCategory: params?.archiveCategory,
    }),
    getDocumentRecordsForSession(session),
    getAvailableDocumentTypes(session),
  ]);

  return (
    <DocumentsPageView
      documents={documents}
      allDocuments={allDocuments}
      documentTypes={documentTypes}
      canUpload={true}
      currentRole={session.role}
      currentEmployeeId={session.employeeId ?? null}
    />
  );
}
