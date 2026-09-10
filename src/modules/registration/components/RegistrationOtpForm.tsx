"use client";

import type { FormEvent } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { RegistrationStepCard } from "./RegistrationStepCard";

type RegistrationOtpFormProps = {
  email: string;
  maskedEmail: string | null;
  otp: string;
  isPending: boolean;
  onOtpChange: (otp: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEditRegistration: () => void;
};

export function RegistrationOtpForm({
  email,
  maskedEmail,
  otp,
  isPending,
  onOtpChange,
  onSubmit,
  onEditRegistration,
}: RegistrationOtpFormProps) {
  return (
    <RegistrationStepCard
      icon={<MailCheck className="size-5" aria-hidden="true" />}
      eyebrow="Verifikasi Email"
      title="Masukkan kode OTP"
      description={`Kode sudah dikirim ke ${maskedEmail || email}.`}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-3 text-center text-sm text-muted-foreground">
          Masukkan 6 digit kode untuk mengirim registrasi ke admin.
        </div>
        <div className="space-y-2">
          <Label htmlFor="otp">Kode OTP</Label>
          <InputOTP
            id="otp"
            name="otp"
            maxLength={6}
            value={otp}
            onChange={onOtpChange}
            inputMode="numeric"
            pattern="[0-9]*"
            disabled={isPending}
            required
            autoFocus
          >
            <InputOTPGroup className="w-full justify-between gap-2">
              {Array.from({ length: 6 }, (_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="size-11 flex-1 rounded-lg border first:border last:border"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          type="submit"
          className="h-10 w-full"
          disabled={isPending || otp.length !== 6}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Verifikasi
        </Button>
        <Button
          type="button"
          variant="link"
          className="h-auto w-full"
          onClick={onEditRegistration}
          disabled={isPending}
        >
          Ubah data registrasi
        </Button>
      </form>
    </RegistrationStepCard>
  );
}
