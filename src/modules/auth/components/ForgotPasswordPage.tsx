"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthCardShell } from "./AuthCardShell";
import { forgotPasswordAction } from "@/modules/auth/actions";

export function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;

    startTransition(async () => {
      const result = await forgotPasswordAction({ email });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setSuccess(true);
    });
  }

  return (
    <AuthCardShell
      eyebrow="Reset akses"
      title="Lupa password?"
      description="Masukkan email akun SIMDP. Jika terdaftar, instruksi pemulihan akan dikirimkan."
      icon={<Mail className="size-5" aria-hidden="true" />}
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
      {success ? (
        <Alert className="border-success/30 bg-success/10 text-success py-3">
          <CheckCircle2 className="size-4" />
          <AlertDescription className="text-success">
            Instruksi reset password telah dikirim ke email Anda. Periksa kotak masuk atau folder spam.
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <Alert variant="destructive" className="py-3">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email terdaftar</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nama@rsud.go.id"
              className="h-10"
              disabled={isPending}
              required
              autoComplete="email"
            />
          </div>

          <Button type="submit" className="h-10 w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              "Kirim"
            )}
          </Button>
        </form>
      )}
    </AuthCardShell>
  );
}
