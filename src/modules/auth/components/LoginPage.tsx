"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthCardShell } from "./AuthCardShell";
import { loginAction, sendTwoFactorEmailCodeAction, verifyTwoFactorLoginAction } from "@/modules/auth";
import { id as defaultDictionary } from "@/i18n/dictionaries/id";

const loginCopy = defaultDictionary.auth.login;

export function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [emailOtpSentTo, setEmailOtpSentTo] = useState<string | null>(null);
  const [isEmailPending, startEmailTransition] = useTransition();
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_2fa") === "1") setRequiresTwoFactor(true);

    if (params.get("session_expired") === "1") {
      setError("Sesi Anda telah berakhir. Silakan login kembali.");
    }

    const oauthError = params.get("oauth_error");
    if (oauthError) {
      const messages: Record<string, string> = {
        not_configured: "Login Google belum dikonfigurasi oleh administrator.",
        unavailable: "Login Google sedang tidak tersedia.",
        invalid_request: "Permintaan login Google tidak valid atau sudah kedaluwarsa.",
        account_not_found: "Email Google belum terdaftar sebagai akun SiCantIK.",
        identity_invalid: "Identitas Google tidak dapat diverifikasi.",
        callback_failed: "Login Google gagal. Silakan coba lagi.",
        rate_limited: "Terlalu banyak percobaan login. Silakan tunggu 15 menit sebelum mencoba login Google lagi.",
      };
      setError(messages[oauthError] ?? "Login Google gagal. Silakan coba lagi.");
    }
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const identifier = (form.elements.namedItem("identifier") as HTMLInputElement)?.value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value;
    const submittedToken = (form.elements.namedItem("token") as HTMLInputElement)?.value || twoFactorToken;

    startTransition(async () => {
      const result = requiresTwoFactor
        ? await verifyTwoFactorLoginAction({ token: submittedToken })
        : await loginAction({ identifier, password });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      if (!requiresTwoFactor && "requiresTwoFactor" in result.data && result.data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  function handleSendEmailCode() {
    startEmailTransition(async () => {
      const result = await sendTwoFactorEmailCodeAction();
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setError(null);
      setEmailOtpSentTo(result.data.maskedEmail);
    });
  }

  return (
    <AuthCardShell
      eyebrow={loginCopy.eyebrow}
      title={loginCopy.title}
      description={loginCopy.description}
      icon={<LockKeyhole className="size-5" aria-hidden="true" />}
      footer={
        <>
          <span>{loginCopy.helpText}</span>
          <Button
            render={<Link href="/forgot-password" />}
            nativeButton={false}
            variant="link"
            className="h-auto p-0"
          >
            {loginCopy.resetPassword}
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

        {requiresTwoFactor ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
              Masukkan kode 6 digit dari aplikasi authenticator. Recovery code juga dapat digunakan jika perangkat tidak tersedia.
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">{useRecoveryCode ? "Recovery code" : "Kode verifikasi 6 digit"}</Label>
              {useRecoveryCode ? (
                <Input
                  id="token"
                  name="token"
                  value={twoFactorToken}
                  onChange={(event) => setTwoFactorToken(event.target.value.toUpperCase())}
                  placeholder="9ACB5-BDB58"
                  autoComplete="one-time-code"
                  maxLength={11}
                  className="h-10 font-mono tracking-[0.18em]"
                  disabled={isPending}
                  required
                  autoFocus
                />
              ) : (
                <InputOTP
                  id="token"
                  name="token"
                  maxLength={6}
                  value={twoFactorToken}
                  onChange={setTwoFactorToken}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  disabled={isPending}
                  required
                  autoFocus
                  aria-label="Kode verifikasi 6 digit"
                >
                  <InputOTPGroup className="w-full justify-between gap-2">
                    {Array.from({ length: 6 }, (_, index) => (
                      <InputOTPSlot key={index} index={index} className="size-11 flex-1 rounded-lg border first:border last:border" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              )}
              <Button type="button" variant="link" size="sm" className="h-auto px-0 text-xs" onClick={() => { setUseRecoveryCode((current) => !current); setTwoFactorToken(""); }}>
                {useRecoveryCode ? "Gunakan kode authenticator" : "Gunakan recovery code"}
              </Button>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>{emailOtpSentTo ? `Kode dikirim ke ${emailOtpSentTo}. Berlaku 10 menit.` : "Tidak bisa memakai authenticator?"}</span>
              <Button type="button" variant="outline" size="sm" onClick={handleSendEmailCode} disabled={isPending || isEmailPending}>
                {isEmailPending ? <Loader2 className="size-4 animate-spin" /> : "Kirim OTP ke email"}
              </Button>
            </div>
          </div>
        ) : null}

        {!requiresTwoFactor ? <div className="space-y-2">
          <Label htmlFor="identifier">{loginCopy.identifierLabel}</Label>
          <Input
            id="identifier"
            name="identifier"
            type="text"
            placeholder={loginCopy.identifierPlaceholder}
            className="h-10"
            disabled={isPending}
            required
            autoComplete="username"
          />
        </div> : null}

        {!requiresTwoFactor ? <div className="space-y-2">
          <Label htmlFor="password">{loginCopy.passwordLabel}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={loginCopy.passwordPlaceholder}
            className="h-10"
            disabled={isPending}
            required
            autoComplete="current-password"
          />
        </div> : null}

        <Button type="submit" className="h-10 w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {loginCopy.processing}
            </>
          ) : (
            requiresTwoFactor ? "Verifikasi dan masuk" : loginCopy.submit
          )}
        </Button>
      </form>
      {!requiresTwoFactor ? (
        <div className="mt-4">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">atau</span></div>
          </div>
          <Button render={<a href="/api/v1/auth/google/start" />} nativeButton={false} variant="outline" className="h-10 w-full">
            Masuk dengan Google
          </Button>
        </div>
      ) : null}
    </AuthCardShell>
  );
}
