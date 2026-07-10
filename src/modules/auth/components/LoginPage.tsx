import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuthCardShell } from "./AuthCardShell";
import { AuthField } from "./AuthField";

export function LoginPage() {
  return (
    <AuthCardShell
      eyebrow="Masuk SIMDP"
      title="Masuk ke akun Anda"
      description="Gunakan NIP, NIK, atau email yang terdaftar untuk mengakses dokumen pegawai."
      icon={<LockKeyhole className="size-5" aria-hidden="true" />}
      footer={
        <>
          <span>Belum bisa masuk?</span>
          <Button render={<Link href="/forgot-password" />} nativeButton={false} variant="link" className="h-auto p-0">
            Ajukan reset password
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <AuthField
          id="identifier"
          label="NIP / NIK / Email"
          placeholder="Contoh: 198501012010011001 atau nama@rsud.go.id"
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          placeholder="Masukkan password akun SIMDP"
        />
      </div>
      <Button className="h-10 w-full">
        Masuk
      </Button>
    </AuthCardShell>
  );
}
