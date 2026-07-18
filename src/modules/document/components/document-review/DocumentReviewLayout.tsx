import type { ReactNode } from "react";

export type DocumentReviewLayoutProps = {
  preview: ReactNode;
  sidebar: ReactNode;
  history?: ReactNode;
};

export function DocumentReviewLayout({ preview, sidebar, history }: DocumentReviewLayoutProps) {
  return (
    <div className="space-y-4">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.8fr)]">
        {preview}
        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">{sidebar}</div>
      </div>
      {history}
    </div>
  );
}
