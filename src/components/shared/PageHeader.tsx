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
    <div className={cn("space-y-2", className)}>
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {backLabel ?? "Kembali"}
        </Link>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-sm font-medium text-primary">{eyebrow}</p>
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
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
                    size: "lg",
                  })}
                >
                  {Icon && iconPosition === "start" ? (
                    <Icon className="size-4" />
                  ) : null}
                  {action.label}
                  {Icon && iconPosition === "end" ? (
                    <Icon className="size-4" />
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
