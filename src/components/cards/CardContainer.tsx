import type { ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/utils";

export type CardContainerProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  size?: "default" | "sm";
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  descriptionClassName?: string;
};

export function CardContainer({
  title,
  description,
  icon,
  action,
  children,
  size = "default",
  className,
  headerClassName,
  contentClassName,
  descriptionClassName,
}: CardContainerProps) {
  return (
    <Card size={size} className={cn("border-muted-foreground/10 shadow-sm", className)}>
      <CardHeader className={cn("flex flex-row items-center justify-between gap-3 space-y-0", headerClassName)}>
        <div className="min-w-0 space-y-1">
          <CardTitle className="flex items-center gap-2 text-sm text-primary">
            {icon}
            {title}
          </CardTitle>
          {description && <CardDescription className={cn("text-xs", descriptionClassName)}>
            {description}
          </CardDescription>}
        </div>
        {action && <CardAction className="col-auto row-auto flex shrink-0 items-center gap-2 self-center">
          {action}
        </CardAction>}
      </CardHeader>
      <CardContent className={cn("pt-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
