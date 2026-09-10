"use client";

import type { FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RegistrationFormProps = {
  isPending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function RegistrationForm({ isPending, onSubmit }: RegistrationFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nama lengkap</Label>
          <Input
            id="name"
            name="name"
            className="h-10"
            required
            disabled={isPending}
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email aktif</Label>
          <Input
            id="email"
            name="email"
            type="email"
            className="h-10"
            required
            disabled={isPending}
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nik">NIK</Label>
          <Input
            id="nik"
            name="nik"
            className="h-10"
            inputMode="numeric"
            placeholder="16 digit"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employeeId">NIP</Label>
          <Input
            id="employeeId"
            name="employeeId"
            className="h-10"
            inputMode="numeric"
            placeholder="Jika ada"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            className="h-10"
            required
            minLength={8}
            disabled={isPending}
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">Minimal 8 karakter.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Nomor HP</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            className="h-10"
            placeholder="08..."
            disabled={isPending}
            autoComplete="tel"
          />
        </div>
      </div>
      <Button type="submit" className="h-10 w-full" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Daftar
      </Button>
    </form>
  );
}
