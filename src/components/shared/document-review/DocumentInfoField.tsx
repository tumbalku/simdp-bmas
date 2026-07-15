import type { ComponentType, ReactNode } from "react";

export type DocumentInfoFieldProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
};

export function DocumentInfoField({ icon: Icon, label, value }: DocumentInfoFieldProps) {
  return (
    <div className="rounded-lg border bg-muted/25 p-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-0.5 break-words text-xs font-medium leading-5 text-foreground">
        {value || "-"}
      </div>
    </div>
  );
}
