import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageHeaderAction = {
  label: string;
  href: string;
  icon?: ComponentType<{ className?: string }>;
  iconPosition?: "start" | "end";
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
};

type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: PageHeaderAction[];
  backHref?: string;
  backLabel?: string;
  trailing?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  backHref,
  backLabel,
  trailing,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {backLabel ?? "Kembali"}
        </Link>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-xs font-medium text-primary">{eyebrow}</p>
          ) : null}
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>

        {actions?.length || trailing ? (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {actions?.map((action) => {
              const Icon = action.icon;
              const iconPosition = action.iconPosition ?? "start";

              return (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className={buttonVariants({
                    variant: action.variant ?? "default",
                    size: "default",
                  })}
                >
                  {Icon && iconPosition === "start" ? (
                    <Icon className="size-3.5" />
                  ) : null}
                  {action.label}
                  {Icon && iconPosition === "end" ? (
                    <Icon className="size-3.5" />
                  ) : null}
                </Link>
              );
            })}
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  );
}
