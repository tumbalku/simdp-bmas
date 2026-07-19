"use client";

import { type ReactNode, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

import { isConfirmationPhraseMatch } from "@/modules/verification";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type CriticalActionVerificationResult =
  | boolean
  | void
  | {
      ok: boolean;
      error?: { message?: string };
    };

export type CriticalActionVerificationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actionLabel: string;
  targetLabel: string;
  targetValue: string;
  confirmationPhrase?: string;
  impacts?: string[];
  icon?: ReactNode;
  tone?: "default" | "destructive" | "success";
  isPending?: boolean;
  onVerifyPassword: (password: string) => Promise<CriticalActionVerificationResult>;
  onConfirm: () => Promise<CriticalActionVerificationResult> | CriticalActionVerificationResult;
};

function isActionSuccess(result: CriticalActionVerificationResult) {
  if (result === false) return false;
  if (typeof result === "object" && result !== null && "ok" in result) return result.ok;
  return true;
}

function getActionError(result: CriticalActionVerificationResult) {
  if (typeof result === "object" && result !== null && "error" in result) {
    return result.error?.message;
  }
  return null;
}

const defaultImpacts = [
  "Aksi ini termasuk tindakan krusial dan dapat mengubah data penting sistem.",
  "Pastikan target, dampak, dan alasan tindakan sudah benar sebelum melanjutkan.",
  "Aktivitas lanjutan tetap diaudit di Server Action terkait.",
];

export function CriticalActionVerificationDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel,
  targetValue,
  confirmationPhrase = targetValue,
  impacts = defaultImpacts,
  icon,
  tone = "destructive",
  isPending = false,
  onVerifyPassword,
  onConfirm,
}: CriticalActionVerificationDialogProps) {
  const [phraseInput, setPhraseInput] = useState("");
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isDestructive = tone === "destructive";
  const isSuccess = tone === "success";
  const phraseMatches = isConfirmationPhraseMatch(phraseInput, confirmationPhrase);
  const canConfirm = phraseMatches && password.trim().length > 0 && !isVerifying && !isPending;
  const toneClassName = isDestructive ? "text-destructive" : isSuccess ? "text-success" : "text-primary";
  const alertClassName = isDestructive
    ? "border-destructive/30 bg-destructive/5"
    : isSuccess
      ? "border-success/30 bg-success/5"
      : "border-primary/25 bg-primary/5";
  const passwordInputClassName = isDestructive
    ? "h-9 text-xs focus-visible:ring-destructive/40"
    : isSuccess
      ? "h-9 text-xs focus-visible:ring-success/40"
      : "h-9 text-xs";
  const actionButtonClassName = isSuccess
    ? "bg-success text-success-foreground hover:bg-success/90 focus-visible:border-success/40 focus-visible:ring-success/20"
    : undefined;

  useEffect(() => {
    if (!open) return;
    setPhraseInput("");
    setPassword("");
    setErrorMessage(null);
    setIsVerifying(false);
  }, [open]);

  const handleConfirm = async () => {
    if (!canConfirm) return;

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const verificationResult = await onVerifyPassword(password);
      if (!isActionSuccess(verificationResult)) {
        setErrorMessage(getActionError(verificationResult) || "Password tidak sesuai.");
        return;
      }

      const confirmResult = await onConfirm();
      if (!isActionSuccess(confirmResult)) {
        setErrorMessage(getActionError(confirmResult) || "Aksi gagal dijalankan.");
        return;
      }

      onOpenChange(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Verifikasi gagal. Coba ulangi.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-hidden sm:max-w-xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${toneClassName}`}>
            {icon ?? <ShieldAlert className="size-4" />}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="-mx-1 max-h-[calc(100dvh-11rem)] space-y-4 overflow-y-auto px-1 pr-2">
          <Alert
            variant={isDestructive ? "destructive" : "default"}
            className={alertClassName}
          >
            <AlertTriangle className={toneClassName} />
            <div className="space-y-2">
              <AlertTitle className="text-xs font-bold">Tindakan ini membutuhkan konfirmasi tambahan</AlertTitle>
              <AlertDescription className="space-y-1 text-[11px] leading-tight">
                {impacts.map((impact) => (
                  <span key={impact} className="block text-foreground">
                    {impact}
                  </span>
                ))}
              </AlertDescription>
            </div>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="critical-action-phrase" className="text-xs">
              Ketik frasa berikut untuk konfirmasi.
            </Label>
            <div
              className="max-w-full select-all overflow-x-auto rounded-md bg-muted px-2 py-1.5"
              aria-label="Frasa konfirmasi"
            >
              <code className="whitespace-nowrap break-normal font-mono text-xs font-semibold text-foreground">
                {confirmationPhrase}
              </code>
            </div>
            <Input
              id="critical-action-phrase"
              value={phraseInput}
              onChange={(event) => setPhraseInput(event.target.value)}
              placeholder="Ketik atau tempel frasa di atas"
              className="h-9 font-mono text-xs"
              autoFocus
              aria-invalid={phraseInput.length > 0 && !phraseMatches}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="critical-action-password" className="text-xs">
              Password akun
            </Label>
            <Input
              id="critical-action-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password akun Anda"
              className={passwordInputClassName}
              aria-invalid={Boolean(errorMessage)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleConfirm();
                }
              }}
            />
          </div>

          {errorMessage ? (
            <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-2.5 py-2 text-[11px] font-semibold text-destructive">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isVerifying || isPending}>
            Batal
          </Button>
          <Button
            type="button"
            variant={isDestructive ? "destructive" : "default"}
            size="sm"
            className={actionButtonClassName}
            disabled={!canConfirm}
            onClick={() => void handleConfirm()}
          >
            {isVerifying || isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
            {isVerifying || isPending ? "Memproses..." : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
