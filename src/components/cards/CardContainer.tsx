import { isValidElement, type ComponentType, type ReactNode } from "react";
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
  icon?: ComponentType<{ className?: string }> | ReactNode;
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
  icon: Icon,
  action,
  children,
  size = "default",
  className,
  headerClassName,
  contentClassName,
  descriptionClassName,
}: CardContainerProps) {
  const renderIcon = () => {
    if (!Icon) return null;
    if (isValidElement(Icon)) return Icon;
    if (typeof Icon === "function" || (typeof Icon === "object" && Icon !== null)) {
      const IconComponent = Icon as ComponentType<{ className?: string }>;
      return <IconComponent className="size-4 shrink-0 text-primary" />;
    }
    return null;
  };

  return (
    <Card size={size} className={cn("border-muted-foreground/10 shadow-sm", className)}>
      <CardHeader className={cn("flex flex-row items-center justify-between gap-3 space-y-0", headerClassName)}>
        <div className="min-w-0 space-y-1">
          <CardTitle className="flex items-center gap-2 text-sm text-primary">
            {renderIcon()}
            {title}
          </CardTitle>
          {description ? (
            <CardDescription className={cn("text-xs", descriptionClassName)}>
              {description}
            </CardDescription>
          ) : null}
        </div>
        {action ? (
          <CardAction className="col-auto row-auto flex shrink-0 items-center gap-2 self-center">
            {action}
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className={cn("pt-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
