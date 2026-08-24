/* eslint-disable @next/next/no-img-element -- QR code is a generated data URL and not a remote image asset. */
"use client";

import { useState, useTransition } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { CardContainer } from "@/components/cards/CardContainer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { beginTwoFactorSetupAction, confirmTwoFactorSetupAction, disableTwoFactorAction } from "@/modules/auth";

export function TwoFactorPanel({ enabled }: { enabled: boolean }) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [setup, setSetup] = useState<{ qrCodeDataUrl: string; secret: string } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [token, setToken] = useState("");
  const [isPending, startTransition] = useTransition();

  function startSetup() {
    startTransition(async () => {
      const result = await beginTwoFactorSetupAction();
      if (result.ok) setSetup(result.data);
      else toast.error(result.error.message);
    });
  }

  function confirmSetup() {
    startTransition(async () => {
      const result = await confirmTwoFactorSetupAction({ token });
      if (!result.ok) { toast.error(result.error.message); return; }
      setIsEnabled(true); setSetup(null); setToken(""); setRecoveryCodes(result.data.recoveryCodes);
      toast.success("2FA berhasil diaktifkan.");
    });
  }

  function disable() {
    startTransition(async () => {
      const result = await disableTwoFactorAction({ token });
      if (!result.ok) { toast.error(result.error.message); return; }
      setIsEnabled(false); setToken(""); toast.success("2FA dinonaktifkan.");
    });
  }

  return (
    <CardContainer
      title="Verifikasi dua langkah"
      description="Gunakan aplikasi authenticator tanpa SMS atau layanan pihak ketiga."
      icon={ShieldCheck}
      contentClassName="space-y-4"
    >
      {isEnabled ? (
        <div className="space-y-3">
          <Alert className="border-emerald-500/20 bg-emerald-500/5"><ShieldCheck className="size-4 text-emerald-600" /><AlertTitle>2FA aktif</AlertTitle><AlertDescription>Akun akan meminta kode authenticator setiap kali login.</AlertDescription></Alert>
          <div className="max-w-sm space-y-2"><Label htmlFor="disable-2fa-token">Kode authenticator atau recovery code untuk menonaktifkan</Label><div className="flex gap-2"><Input id="disable-2fa-token" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="one-time-code" disabled={isPending} /><Button type="button" variant="outline" onClick={disable} disabled={isPending || !token}>{isPending ? <Loader2 className="size-4 animate-spin" /> : "Nonaktifkan"}</Button></div></div>
        </div>
      ) : setup ? (
        <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-center"><img src={setup.qrCodeDataUrl} alt="QR code untuk setup authenticator" className="size-48 rounded-md border bg-white p-2" /><div className="space-y-3 text-sm"><p>Scan QR code dengan aplikasi authenticator, lalu masukkan kode yang muncul untuk mengonfirmasi.</p><div className="break-all rounded-md border bg-muted/20 p-3 font-mono text-xs">{setup.secret}</div><div className="space-y-2"><Label htmlFor="confirm-2fa-token">Kode konfirmasi</Label><div className="flex gap-2"><Input id="confirm-2fa-token" value={token} onChange={(event) => setToken(event.target.value)} inputMode="numeric" autoComplete="one-time-code" disabled={isPending} /><Button type="button" onClick={confirmSetup} disabled={isPending || !token}>{isPending ? <Loader2 className="size-4 animate-spin" /> : "Aktifkan"}</Button></div></div></div></div>
      ) : (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-semibold">2FA belum aktif</div><p className="text-xs text-muted-foreground">Tambahkan keamanan dengan Google Authenticator, Microsoft Authenticator, atau Aegis.</p></div><Button type="button" onClick={startSetup} disabled={isPending}>{isPending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}Aktifkan 2FA</Button></div>
      )}
      {recoveryCodes.length > 0 ? <Alert className="border-amber-500/30 bg-amber-500/5"><KeyRound className="size-4 text-amber-600" /><AlertTitle>Simpan recovery codes sekarang</AlertTitle><AlertDescription>Kode ini hanya ditampilkan sekali. Simpan di tempat aman.<div className="mt-3 grid grid-cols-2 gap-2 rounded-md border bg-background p-3 font-mono text-xs">{recoveryCodes.map((code) => <span key={code}>{code}</span>)}</div></AlertDescription></Alert> : null}
    </CardContainer>
  );
}
