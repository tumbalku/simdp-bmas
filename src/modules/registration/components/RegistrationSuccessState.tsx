"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { RegistrationStepCard } from "./RegistrationStepCard";

export function RegistrationSuccessState() {
  return (
    <RegistrationStepCard
      icon={<CheckCircle2 className="size-5" aria-hidden="true" />}
      eyebrow="Menunggu Verifikasi"
      title="Registrasi masuk antrian admin"
      description="Data Anda sudah diterima dan menunggu pengecekan admin."
    >
      <div className="space-y-4 text-center">
        <p className="rounded-lg border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
          Email sudah terverifikasi. Anda belum bisa login sampai admin
          menyetujui akses. Pemberitahuan persetujuan akan dikirim ke email
          pendaftaran Anda.
        </p>
        <Button
          render={<Link href={ROUTES.login} />}
          nativeButton={false}
          variant="outline"
          className="w-full"
        >
          Kembali ke login
        </Button>
      </div>
    </RegistrationStepCard>
  );
}
