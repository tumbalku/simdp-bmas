"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type RegistrationStepCardProps = {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function RegistrationStepCard({
  icon,
  eyebrow,
  title,
  description,
  children,
}: RegistrationStepCardProps) {
  return (
    <Card className="w-full rounded-2xl border-border/80 shadow-sm">
      <CardContent className="space-y-5 p-6">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            {icon}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {eyebrow}
            </p>
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight">{title}</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
