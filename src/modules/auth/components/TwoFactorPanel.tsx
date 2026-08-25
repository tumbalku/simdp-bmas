/* eslint-disable @next/next/no-img-element -- QR code is a generated data URL and not a remote image asset. */
"use client";

import { useState, useTransition } from "react";
import { Copy, Download, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { CardContainer } from "@/components/cards/CardContainer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { beginTwoFactorSetupAction, confirmTwoFactorSetupAction, disableTwoFactorAction } from "@/modules/auth";

export function TwoFactorPanel({ enabled }: { enabled: boolean }) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [setup, setSetup] = useState<{ qrCodeDataUrl: string; secret: string } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [token, setToken] = useState("");
  const [useRecoveryForDisable, setUseRecoveryForDisable] = useState(false);
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

  function copyAllCodes() {
    if (recoveryCodes.length === 0) return;
    const text = recoveryCodes.join("\n");
    void navigator.clipboard.writeText(text);
    toast.success("Semua recovery code berhasil disalin ke clipboard.");
  }

  function downloadCodes() {
    if (recoveryCodes.length === 0) return;
    const text = `KODE PEMULIHAN 2FA - SiCantIK\nTanggal: ${new Date().toLocaleDateString()}\n\nSimpan kode ini di tempat aman. Masing-masing kode hanya dapat digunakan 1 kali.\n\n${recoveryCodes.join("\n")}\n`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "sicantik-recovery-codes.txt";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Berkas recovery codes berhasil diunduh.");
  }

  return (
    <CardContainer
      title="Verifikasi dua langkah"
      description="Gunakan aplikasi authenticator tanpa SMS atau layanan pihak ketiga."
      icon={<ShieldCheck className="size-4 shrink-0 text-primary" />}
      contentClassName="space-y-4"
    >
      {isEnabled ? (
        <div className="space-y-4">
          <Alert className="border-emerald-500/20 bg-emerald-500/5">
            <ShieldCheck className="size-4 text-emerald-600" />
            <AlertTitle>2FA aktif</AlertTitle>
            <AlertDescription>Akun akan meminta kode authenticator setiap kali login.</AlertDescription>
          </Alert>

          <div className="max-w-md space-y-3 rounded-lg border bg-muted/10 p-3.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="disable-2fa-token" className="text-xs font-semibold text-foreground">
                {useRecoveryForDisable ? "Recovery code (6 karakter)" : "Kode authenticator 6 digit"}
              </Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => {
                  setUseRecoveryForDisable((prev) => !prev);
                  setToken("");
                }}
              >
                {useRecoveryForDisable ? "Gunakan authenticator" : "Gunakan recovery code"}
              </Button>
            </div>

            {useRecoveryForDisable ? (
              <InputOTP
                id="disable-2fa-token"
                maxLength={6}
                value={token}
                onChange={(val) => setToken(val.toUpperCase())}
                autoComplete="one-time-code"
                disabled={isPending}
                aria-label="Recovery code 6 karakter"
              >
                <InputOTPGroup className="w-full justify-between gap-1.5">
                  {Array.from({ length: 6 }, (_, i) => (
                    <InputOTPSlot key={i} index={i} className="size-9 flex-1 rounded-md border font-mono uppercase text-sm font-semibold" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            ) : (
              <InputOTP
                id="disable-2fa-token"
                maxLength={6}
                value={token}
                onChange={setToken}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                disabled={isPending}
                aria-label="Kode authenticator 6 digit"
              >
                <InputOTPGroup className="w-full justify-between gap-1.5">
                  {Array.from({ length: 6 }, (_, i) => (
                    <InputOTPSlot key={i} index={i} className="size-9 flex-1 rounded-md border text-sm font-semibold" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            )}

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={disable}
              disabled={isPending || token.length < 6}
              className="w-full"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : "Nonaktifkan 2FA"}
            </Button>
          </div>
        </div>
      ) : setup ? (
        <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
          <img src={setup.qrCodeDataUrl} alt="QR code untuk setup authenticator" className="size-48 rounded-md border bg-white p-2" />
          <div className="space-y-3 text-sm">
            <p>Scan QR code dengan aplikasi authenticator, lalu masukkan kode yang muncul untuk mengonfirmasi.</p>
            <div className="break-all rounded-md border bg-muted/20 p-3 font-mono text-xs">{setup.secret}</div>
            <div className="space-y-2">
              <Label htmlFor="confirm-2fa-token" className="text-xs font-semibold">Kode konfirmasi 6 digit</Label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <InputOTP
                  id="confirm-2fa-token"
                  maxLength={6}
                  value={token}
                  onChange={setToken}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  disabled={isPending}
                  containerClassName="w-full sm:w-auto"
                  aria-label="Kode konfirmasi 6 digit"
                >
                  <InputOTPGroup className="w-full justify-between gap-1.5 sm:gap-2">
                    {Array.from({ length: 6 }, (_, i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="size-10 sm:size-9 flex-1 sm:flex-initial rounded-md border text-sm font-semibold"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <Button
                  type="button"
                  onClick={confirmSetup}
                  disabled={isPending || token.length < 6}
                  className="w-full sm:w-auto"
                >
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : "Aktifkan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-semibold">2FA belum aktif</div><p className="text-xs text-muted-foreground">Tambahkan keamanan dengan Google Authenticator, Microsoft Authenticator, atau Aegis.</p></div><Button type="button" onClick={startSetup} disabled={isPending}>{isPending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}Aktifkan 2FA</Button></div>
      )}
      {recoveryCodes.length > 0 ? (
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <KeyRound className="size-4 text-amber-600" />
          <AlertTitle>Simpan recovery codes sekarang</AlertTitle>
          <AlertDescription>
            Kode ini hanya ditampilkan sekali. Simpan di tempat aman.
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-md border bg-background p-3 font-mono text-xs">
              {recoveryCodes.map((code) => (
                <span key={code} className="select-all font-semibold tracking-wider">{code}</span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={copyAllCodes}>
                <Copy className="size-3.5" /> Salin Semua
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={downloadCodes}>
                <Download className="size-3.5" /> Unduh .TXT
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}
    </CardContainer>
  );
}
