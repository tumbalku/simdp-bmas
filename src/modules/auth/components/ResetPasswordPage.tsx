import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuthCardShell } from "./AuthCardShell";
import { AuthField } from "./AuthField";

export function ResetPasswordPage() {
  return (
    <AuthCardShell
      eyebrow="Password baru"
      title="Buat password baru"
      description="Siapkan password baru minimal 8 karakter untuk mengamankan akun SIMDP Anda."
      icon={<KeyRound className="size-5" aria-hidden="true" />}
      footer={
        <Button render={<Link href="/login" />} nativeButton={false} variant="link" className="h-auto p-0">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke login
        </Button>
      }
    >
      <div className="space-y-4">
        <AuthField
          id="token"
          label="Token reset"
          placeholder="Token dari tautan email reset password"
          helper="Nanti token dapat dibaca dari tautan reset password."
        />
        <AuthField
          id="new-password"
          label="Password baru"
          type="password"
          placeholder="Minimal 8 karakter"
        />
        <AuthField
          id="confirm-password"
          label="Konfirmasi password baru"
          type="password"
          placeholder="Ulangi password baru"
        />
      </div>
      <Button className="h-10 w-full">
        Simpan
      </Button>
    </AuthCardShell>
  );
}
