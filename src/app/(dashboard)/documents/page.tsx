import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getDocumentRecordsAction, getDocumentTypeOptionsAction } from "@/modules/document";
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

  const [documentsResult, allDocumentsResult, documentTypesResult] = await Promise.all([
    getDocumentRecordsAction({
      search: params?.search,
      documentTypeId: params?.documentTypeId,
      archiveCategory: params?.archiveCategory,
    }),
    getDocumentRecordsAction(),
    getDocumentTypeOptionsAction(),
  ]);

  if (!documentsResult.ok || !allDocumentsResult.ok || !documentTypesResult.ok) {
    redirect("/login");
  }

  return (
    <DocumentsPageView
      documents={documentsResult.data}
      allDocuments={allDocumentsResult.data}
      documentTypes={documentTypesResult.data}
      canUpload={true}
      currentRole={session.role}
    />
  );
}
