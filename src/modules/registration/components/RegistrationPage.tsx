"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { AuthCardShell } from "@/modules/auth/components";
import { submitRegistrationAction, verifyRegistrationOtpAction } from "../actions";
import { submitRegistrationSchema } from "../schema";
import { RegistrationForm } from "./RegistrationForm";
import { RegistrationOtpForm } from "./RegistrationOtpForm";
import { RegistrationSuccessState } from "./RegistrationSuccessState";

type Step = "form" | "otp" | "done";

type RegistrationPageProps = {
  enabled: boolean;
};

export function RegistrationPage({ enabled }: RegistrationPageProps) {
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      nik: String(formData.get("nik") || ""),
      employeeId: String(formData.get("employeeId") || ""),
      password: String(formData.get("password") || ""),
      phone: String(formData.get("phone") || ""),
    };

    const parsed = submitRegistrationSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues.map((issue) => issue.message).join(". "));
      return;
    }

    startTransition(async () => {
      const result = await submitRegistrationAction(parsed.data);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setEmail(payload.email.trim().toLowerCase());
      setMaskedEmail(result.data.maskedEmail);
      setStep("otp");
    });
  }

  function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await verifyRegistrationOtpAction({ email, otp });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setStep("done");
    });
  }

  if (enabled && step === "otp") {
    return (
      <div className="w-full space-y-5">
        {error ? (
          <Alert variant="destructive" className="py-3">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <RegistrationOtpForm
          email={email}
          maskedEmail={maskedEmail}
          otp={otp}
          isPending={isPending}
          onOtpChange={setOtp}
          onSubmit={handleVerifyOtp}
          onEditRegistration={() => setStep("form")}
        />
      </div>
    );
  }

  if (enabled && step === "done") {
    return (
      <div className="w-full">
        <RegistrationSuccessState />
      </div>
    );
  }

  return (
    <AuthCardShell
      eyebrow="Registrasi SiCantIK"
      title="Daftar akses pegawai"
      description="Isi data inti, verifikasi email, lalu tunggu persetujuan admin."
      icon={<UserPlus className="size-5" aria-hidden="true" />}
      footer={
        <>
          <span>Sudah punya akun?</span>
          <Button render={<Link href={ROUTES.login} />} nativeButton={false} variant="link" className="h-auto p-0">
            Masuk ke SiCantIK
          </Button>
        </>
      }
    >
      {!enabled ? (
        <Alert className="py-3">
          <AlertCircle className="size-4" />
          <AlertDescription>Registrasi mandiri belum dibuka. Silakan hubungi admin kepegawaian.</AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" className="py-3">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {enabled && step === "form" ? (
        <RegistrationForm isPending={isPending} onSubmit={handleSubmit} />
      ) : null}
    </AuthCardShell>
  );
}
