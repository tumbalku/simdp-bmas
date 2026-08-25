import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils";

export type PageHeaderButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";

export type PageHeaderActionBase = {
  label: string;
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  variant?: PageHeaderButtonVariant;
  hideLabelOnMobile?: boolean;
  className?: string;
};

export type PageHeaderLinkAction = PageHeaderActionBase & {
  href: string;
  onClick?: never;
  prefetch?: boolean;
};

export type PageHeaderButtonAction = PageHeaderActionBase & {
  href?: never;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
};

export type PageHeaderAction = PageHeaderLinkAction | PageHeaderButtonAction;

export type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: PageHeaderAction[];
  backHref?: string;
  backLabel?: string;
  trailing?: ReactNode;
  className?: string;
};

function PageHeaderActionButton(action: PageHeaderAction) {
  const {
    label,
    icon,
    iconPosition = "start",
    variant = "default",
    hideLabelOnMobile = true,
    className,
  } = action;

  const commonClasses = cn(
    hideLabelOnMobile && "size-10 p-0 sm:size-auto sm:h-8 sm:px-2.5",
    className
  );

  const content = (
    <>
      {iconPosition === "start" && icon}
      {hideLabelOnMobile ? (
        <span className="hidden sm:inline">{label}</span>
      ) : (
        label
      )}
      {iconPosition === "end" && icon}
    </>
  );

  if ("href" in action && typeof action.href === "string") {
    return (
      <Link
        href={action.href}
        prefetch={action.prefetch}
        aria-label={hideLabelOnMobile ? label : undefined}
        className={cn(buttonVariants({ variant, size: "default" }), commonClasses)}
      >
        {content}
      </Link>
    );
  }

  return (
    <Button
      type={action.type ?? "button"}
      variant={variant}
      onClick={action.onClick}
      disabled={action.disabled}
      aria-label={hideLabelOnMobile ? label : undefined}
      className={commonClasses}
    >
      {content}
    </Button>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  backHref,
  backLabel = "Kembali",
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
          {backLabel}
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
            {actions?.map((action, index) => (
              <PageHeaderActionButton
                key={action.href ?? `${action.label}-${index}`}
                {...action}
              />
            ))}
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  );
}
