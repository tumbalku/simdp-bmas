import { ExternalLink, FileText } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type DocumentPreviewPanelProps = {
  fileName: string;
  mimeType: string | null;
  previewError: string | null;
  previewLoading: boolean;
  previewUrl: string | null;
  title: string;
};

function canPreviewInline(mimeType: string | null) {
  if (!mimeType) return false;
  return mimeType === "application/pdf" || mimeType.startsWith("image/");
}

function isImageMime(mimeType: string | null) {
  return Boolean(mimeType?.startsWith("image/"));
}

export function DocumentPreviewPanel({
  fileName,
  mimeType,
  previewError,
  previewLoading,
  previewUrl,
  title,
}: DocumentPreviewPanelProps) {
  const supportedPreview = canPreviewInline(mimeType);

  return (
    <Card className="flex min-h-[620px] overflow-hidden border-0 shadow-none lg:h-[calc(100vh-8rem)]">
      <div className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="size-4" />
              Pratinjau Berkas
            </CardTitle>
            <CardDescription className="text-xs">
              Periksa isi dokumen tanpa mengunduh berkas terlebih dahulu.
            </CardDescription>
          </div>
          <a
            href={previewUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!previewUrl}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: !previewUrl ? "pointer-events-none opacity-50" : undefined,
            })}
          >
            <ExternalLink className="mr-1.5 size-3.5" />
            Buka di Tab Baru
          </a>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 p-0">
          {previewLoading ? (
            <div className="flex h-full min-h-[560px] flex-col justify-center gap-3 p-4">
              <Skeleton className="min-h-[520px] w-full flex-1 rounded-lg" />
              <p className="text-center text-xs text-muted-foreground">
                Menyiapkan pratinjau berkas...
              </p>
            </div>
          ) : previewUrl && supportedPreview ? (
            isImageMime(mimeType) ? (
              <div className="flex h-full min-h-[560px] items-center justify-center bg-muted/30 p-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- authenticated temporary preview URL is not suitable for next/image optimization */}
                <img
                  src={previewUrl}
                  alt={`Pratinjau ${title}`}
                  className="h-full max-h-full w-full object-contain"
                />
              </div>
            ) : (
              <iframe
                src={previewUrl}
                title={`Pratinjau ${title}`}
                className="h-full min-h-[560px] w-full border-0 bg-muted"
              />
            )
          ) : (
            <div className="flex h-full min-h-[560px] items-center justify-center bg-muted/20 p-4 text-center">
              <div className="max-w-sm space-y-2">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
                  <FileText className="size-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Pratinjau tidak tersedia</p>
                  <p className="text-xs text-muted-foreground">
                    {previewError ||
                      `Format ${mimeType || fileName} belum didukung untuk pratinjau langsung.`}
                  </p>
                </div>
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <ExternalLink className="mr-1.5 size-3.5" />
                    Buka Berkas
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
