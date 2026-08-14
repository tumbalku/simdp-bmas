import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
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

export type PageHeaderLinkProps = {
  href: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  iconPosition?: "start" | "end";
  variant?: PageHeaderButtonVariant;
  hideLabelOnMobile?: boolean;
  prefetch?: boolean;
  className?: string;
};

export function PageHeaderLink({
  href,
  label,
  icon: Icon,
  iconPosition = "start",
  variant = "default",
  hideLabelOnMobile = true,
  prefetch,
  className,
}: PageHeaderLinkProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      aria-label={hideLabelOnMobile ? label : undefined}
      className={cn(
        buttonVariants({ variant, size: "default" }),
        hideLabelOnMobile && "size-8 p-0 sm:size-auto sm:h-8 sm:px-2.5",
        className
      )}
    >
      {Icon && iconPosition === "start" ? <Icon className="size-3.5" /> : null}
      {hideLabelOnMobile ? (
        <span className="hidden sm:inline">{label}</span>
      ) : (
        label
      )}
      {Icon && iconPosition === "end" ? <Icon className="size-3.5" /> : null}
    </Link>
  );
}

export type PageHeaderButtonProps = {
  label: string;
  onClick?: () => void;
  icon?: ComponentType<{ className?: string }>;
  iconPosition?: "start" | "end";
  variant?: PageHeaderButtonVariant;
  hideLabelOnMobile?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
};

export function PageHeaderButton({
  label,
  onClick,
  icon: Icon,
  iconPosition = "start",
  variant = "default",
  hideLabelOnMobile = true,
  disabled = false,
  type = "button",
  className,
}: PageHeaderButtonProps) {
  return (
    <Button
      type={type}
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      aria-label={hideLabelOnMobile ? label : undefined}
      className={cn(
        hideLabelOnMobile && "size-8 p-0 sm:size-auto sm:h-8 sm:px-2.5",
        className
      )}
    >
      {Icon && iconPosition === "start" ? <Icon className="size-3.5" /> : null}
      {hideLabelOnMobile ? (
        <span className="hidden sm:inline">{label}</span>
      ) : (
        label
      )}
      {Icon && iconPosition === "end" ? <Icon className="size-3.5" /> : null}
    </Button>
  );
}

export type PageHeaderAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ComponentType<{ className?: string }>;
  iconPosition?: "start" | "end";
  prefetch?: boolean;
  variant?: PageHeaderButtonVariant;
  hideLabelOnMobile?: boolean;
  className?: string;
};

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
              if (action.onClick) {
                return (
                  <PageHeaderButton
                    key={action.href ? `${action.href}-${action.label}` : `action-${index}-${action.label}`}
                    label={action.label}
                    onClick={action.onClick}
                    icon={action.icon}
                    iconPosition={action.iconPosition}
                    variant={action.variant}
                    hideLabelOnMobile={action.hideLabelOnMobile}
                    className={action.className}
                  />
                );
              }

              if (!action.href) {
                return null;
              }

              return (
                <PageHeaderLink
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  label={action.label}
                  icon={action.icon}
                  iconPosition={action.iconPosition}
                  variant={action.variant}
                  hideLabelOnMobile={action.hideLabelOnMobile}
                  prefetch={action.prefetch}
                  className={action.className}
                />
              );
            })}
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  );
}
