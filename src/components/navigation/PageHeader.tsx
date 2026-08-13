import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils";

type PageHeaderAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ComponentType<{ className?: string }>;
  iconPosition?: "start" | "end";
  prefetch?: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  hideLabelOnMobile?: boolean;
  className?: string;
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

      <div className="flex items-center justify-between gap-3 sm:items-end">
        <div>
          {eyebrow ? (
            <p className="text-xs font-medium text-primary">{eyebrow}</p>
          ) : null}
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">{description}</p>
          ) : null}
        </div>

        {actions?.length || trailing ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {actions?.map((action, index) => {
              const Icon = action.icon;
              const iconPosition = action.iconPosition ?? "start";

              if (action.onClick) {
                return (
                  <Button
                    key={action.href ? `${action.href}-${action.label}` : `action-${index}-${action.label}`}
                    variant={action.variant ?? "default"}
                    onClick={action.onClick}
                    aria-label={action.hideLabelOnMobile ? action.label : undefined}
                    className={cn(
                      action.hideLabelOnMobile && "size-8 p-0 sm:size-auto sm:h-8 sm:px-2.5",
                      action.className
                    )}
                  >
                    {Icon && iconPosition === "start" ? (
                      <Icon className="size-3.5" />
                    ) : null}
                    {action.hideLabelOnMobile ? (
                      <span className="hidden sm:inline">{action.label}</span>
                    ) : (
                      action.label
                    )}
                    {Icon && iconPosition === "end" ? (
                      <Icon className="size-3.5" />
                    ) : null}
                  </Button>
                );
              }

              if (!action.href) {
                return null;
              }

              return (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  prefetch={action.prefetch}
                  aria-label={action.hideLabelOnMobile ? action.label : undefined}
                  className={cn(
                    buttonVariants({
                      variant: action.variant ?? "default",
                      size: "default",
                    }),
                    action.hideLabelOnMobile && "size-8 p-0 sm:size-auto sm:h-9 sm:px-4",
                    action.className
                  )}
                >
                  {Icon && iconPosition === "start" ? (
                    <Icon className="size-3.5" />
                  ) : null}
                  {action.hideLabelOnMobile ? (
                    <span className="hidden sm:inline">{action.label}</span>
                  ) : (
                    action.label
                  )}
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
