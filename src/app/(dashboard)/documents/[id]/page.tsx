import { notFound, redirect } from "next/navigation";
import { ROUTES } from "@/constants";
import { requireAuth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { DocumentDetailView } from "@/modules/document/components/DocumentDetailView";
import { getDocumentRecordDetailForSession } from "@/modules/document/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
};

function getBackNavigation(returnTo?: string) {
  if (
    returnTo &&
    new RegExp(`^${ROUTES.masterDataEmployees}/[^/?#]+(?:\\?.*)?$`).test(returnTo)
  ) {
    return {
      backHref: returnTo,
      backLabel: "Kembali ke detail pegawai",
    };
  }

  if (
    returnTo === ROUTES.masterDataDocuments ||
    returnTo?.startsWith(`${ROUTES.masterDataDocuments}?`)
  ) {
    return {
      backHref: returnTo,
      backLabel: "Kembali ke master data dokumen",
    };
  }

  if (returnTo === ROUTES.documents || returnTo?.startsWith(`${ROUTES.documents}?`)) {
    return {
      backHref: returnTo,
      backLabel: "Kembali ke dokumen",
    };
  }

  return {
    backHref: ROUTES.documents,
    backLabel: "Kembali ke dokumen",
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const session = await requireAuth();

  try {
    const document = await getDocumentRecordDetailForSession(id, session);

    return (
      <DocumentDetailView
        document={document}
        {...getBackNavigation(resolvedSearchParams?.returnTo)}
      />
    );
  } catch (error) {
    if (
      error instanceof AppError &&
      (error.code === "NOT_FOUND" || error.code === "OWNERSHIP_REQUIRED")
    ) {
      notFound();
    }
    redirect("/login");
  }
}
