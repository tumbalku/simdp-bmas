"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RegistrationRequestListItem } from "../service";

type RegistrationReviewDialogProps = {
  request: RegistrationRequestListItem | null;
  isPending: boolean;
  onClose: () => void;
  onReview: (action: "approve" | "reject") => void;
};

export function RegistrationReviewDialog({
  request,
  isPending,
  onClose,
  onReview,
}: RegistrationReviewDialogProps) {
  const details = request
    ? [
        ["Nama lengkap", request.name],
        ["Email", request.email],
        ["NIK", request.nik],
        ["NIP", request.claimedNip],
        ["Nomor HP", request.phone],
      ]
    : [];
  return (
    <Dialog
      open={Boolean(request)}
      onOpenChange={(open) => {
        if (!open && !isPending) onClose();
      }}
    >
      <DialogContent
        className="max-h-[85dvh] overflow-y-auto sm:max-w-lg"
        showCloseButton={!isPending}
      >
        <DialogHeader>
          <DialogTitle>Tinjau Registrasi</DialogTitle>
          <DialogDescription>
            Periksa data pendaftar. Persetujuan akan membuat akun login dan
            profil pegawai.
          </DialogDescription>
        </DialogHeader>
        <dl className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label} className="min-w-0 space-y-1">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="break-words text-sm font-medium">
                {value || "-"}
              </dd>
            </div>
          ))}
        </dl>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={() => onReview("reject")}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <XCircle className="size-4" />
            )}
            Tolak
          </Button>
          <Button onClick={() => onReview("approve")} disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Setujui
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
