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
  await requireAuth();
  const params = await searchParams;

  const [documentsResult, documentTypesResult] = await Promise.all([
    getDocumentRecordsAction({
      search: params?.search,
      documentTypeId: params?.documentTypeId,
      archiveCategory: params?.archiveCategory,
    }),
    getDocumentTypeOptionsAction(),
  ]);

  if (!documentsResult.ok || !documentTypesResult.ok) {
    redirect("/login");
  }

  return (
    <DocumentsPageView
      documents={documentsResult.data}
      documentTypes={documentTypesResult.data}
      canUpload={true}
    />
  );
}
