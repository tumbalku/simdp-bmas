import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuthCardShell } from "./AuthCardShell";
import { AuthField } from "./AuthField";

export function ForgotPasswordPage() {
  return (
    <AuthCardShell
      eyebrow="Reset akses"
      title="Lupa password?"
      description="Masukkan email akun SIMDP. Jika terdaftar, instruksi pemulihan akan dikirimkan."
      icon={<Mail className="size-5" aria-hidden="true" />}
      footer={
        <Button render={<Link href="/login" />} nativeButton={false} variant="link" className="h-auto p-0">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke login
        </Button>
      }
    >
      <AuthField
        id="email"
        label="Email terdaftar"
        type="email"
        placeholder="nama@rsud.go.id"
      />
      <Button className="h-10 w-full">
        Kirim
      </Button>
    </AuthCardShell>
  );
}
