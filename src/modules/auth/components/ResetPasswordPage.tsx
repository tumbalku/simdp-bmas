"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, KeyRound, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthCardShell } from "./AuthCardShell";
import { resetPasswordAction } from "@/modules/auth/actions";

export function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const token = (form.elements.namedItem("token") as HTMLInputElement).value;
    const newPassword = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;

    startTransition(async () => {
      const result = await resetPasswordAction({ token, newPassword, confirmPassword });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      router.push("/login?reset=success");
    });
  }

  return (
    <AuthCardShell
      eyebrow="Password baru"
      title="Buat password baru"
      description="Siapkan password baru minimal 8 karakter untuk mengamankan akun SIMDP Anda."
      icon={<KeyRound className="size-5" aria-hidden="true" />}
      footer={
        <Button
          render={<Link href="/login" />}
          nativeButton={false}
          variant="link"
          className="h-auto p-0"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke login
        </Button>
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
          <Label htmlFor="token">Token reset</Label>
          <Input
            id="token"
            name="token"
            type="text"
            placeholder="Token dari tautan email reset password"
            defaultValue={tokenFromUrl}
            className="h-10"
            disabled={isPending}
            required
          />
          <p className="text-xs text-muted-foreground">
            Token diisi otomatis jika Anda membuka tautan dari email.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">Password baru</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            placeholder="Minimal 8 karakter"
            className="h-10"
            disabled={isPending}
            required
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Konfirmasi password baru</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Ulangi password baru"
            className="h-10"
            disabled={isPending}
            required
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" className="h-10 w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan"
          )}
        </Button>
      </form>
    </AuthCardShell>
  );
}
