"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthCardShell } from "./AuthCardShell";
import { loginAction } from "@/modules/auth/actions";

export function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const identifier = (form.elements.namedItem("identifier") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    startTransition(async () => {
      const result = await loginAction({ identifier, password });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <AuthCardShell
      eyebrow="Masuk SIMDP"
      title="Masuk ke akun Anda"
      description="Gunakan NIP, NIK, atau email yang terdaftar untuk mengakses dokumen pegawai."
      icon={<LockKeyhole className="size-5" aria-hidden="true" />}
      footer={
        <>
          <span>Belum bisa masuk?</span>
          <Button
            render={<Link href="/forgot-password" />}
            nativeButton={false}
            variant="link"
            className="h-auto p-0"
          >
            Ajukan reset password
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <Alert variant="destructive" className="py-3">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="identifier">NIP / NIK / Email</Label>
          <Input
            id="identifier"
            name="identifier"
            type="text"
            placeholder="Contoh: 198501012010011001 atau nama@rsud.go.id"
            className="h-10"
            disabled={isPending}
            required
            autoComplete="username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Masukkan password akun SIMDP"
            className="h-10"
            disabled={isPending}
            required
            autoComplete="current-password"
          />
        </div>

        <Button type="submit" className="h-10 w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Memproses...
            </>
          ) : (
            "Masuk"
          )}
        </Button>
      </form>
    </AuthCardShell>
  );
}
