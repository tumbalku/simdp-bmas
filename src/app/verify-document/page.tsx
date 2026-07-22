import { headers } from "next/headers";

import { env } from "@/lib/env";
import { API_RATE_LIMIT_CATEGORY, enforceApiRateLimit } from "@/lib/rate-limit";
import { VerifyDocumentPage as VerifyDocumentPageComponent } from "@/modules/document-verification/components";
import { documentVerificationCodeSchema, verifyDocumentCode } from "@/modules/document-verification/server";

type VerifyDocumentPageProps = {
  searchParams: Promise<{
    code?: string;
  }>;
};

export default async function VerifyDocumentPage({ searchParams }: VerifyDocumentPageProps) {
  const { code } = await searchParams;

  if (!code) {
    return <VerifyDocumentPageComponent result={null} />;
  }

  const parsed = documentVerificationCodeSchema.safeParse(code);
  if (!parsed.success) {
    return <VerifyDocumentPageComponent result={null} error="Kode verifikasi dokumen tidak valid." />;
  }

  const requestUrl = new URL("/verify-document", env.NEXT_PUBLIC_APP_URL);
  requestUrl.searchParams.set("code", parsed.data);
  const rateLimitResponse = await enforceApiRateLimit(
    new Request(requestUrl, { headers: await headers() }),
    API_RATE_LIMIT_CATEGORY.DOCUMENT_VERIFY,
  );

  if (rateLimitResponse) {
    return (
      <VerifyDocumentPageComponent
        result={null}
        error="Terlalu banyak permintaan verifikasi. Coba lagi beberapa saat lagi."
      />
    );
  }

  const result = await verifyDocumentCode(parsed.data);
  return <VerifyDocumentPageComponent result={result} />;
}
