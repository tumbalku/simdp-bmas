import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AuthCardShell({
  eyebrow,
  title,
  description,
  icon,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <Card className="w-full rounded-2xl border-border/80 shadow-sm">
      <CardHeader className="space-y-4 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="rounded-xl bg-accent p-3 text-accent-foreground">{icon}</div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {eyebrow}
            </p>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                {title}
              </CardTitle>
              <CardDescription className="leading-6">{description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">{children}</div>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        {footer}
      </CardFooter>
    </Card>
  );
}
