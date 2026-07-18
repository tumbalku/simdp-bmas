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
import { resetPasswordAction } from "@/modules/auth";
import { id as defaultDictionary } from "@/i18n/dictionaries/id";

const resetPasswordCopy = defaultDictionary.auth.resetPassword;

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
      eyebrow={resetPasswordCopy.eyebrow}
      title={resetPasswordCopy.title}
      description={resetPasswordCopy.description}
      icon={<KeyRound className="size-5" aria-hidden="true" />}
      footer={
        <Button
          render={<Link href="/login" />}
          nativeButton={false}
          variant="link"
          className="h-auto p-0"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {resetPasswordCopy.backToLogin}
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
          <Label htmlFor="token">{resetPasswordCopy.tokenLabel}</Label>
          <Input
            id="token"
            name="token"
            type="text"
            placeholder={resetPasswordCopy.tokenPlaceholder}
            defaultValue={tokenFromUrl}
            className="h-10"
            disabled={isPending}
            required
          />
          <p className="text-xs text-muted-foreground">
            {resetPasswordCopy.tokenHelp}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">{resetPasswordCopy.newPasswordLabel}</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            placeholder={resetPasswordCopy.newPasswordPlaceholder}
            className="h-10"
            disabled={isPending}
            required
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{resetPasswordCopy.confirmPasswordLabel}</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder={resetPasswordCopy.confirmPasswordPlaceholder}
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
              {resetPasswordCopy.saving}
            </>
          ) : (
            resetPasswordCopy.submit
          )}
        </Button>
      </form>
    </AuthCardShell>
  );
}
