"use client";

import { useState, useTransition } from "react";
import { KeyRound, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/modules/auth";

type ChangePasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const initialForm: ChangePasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ChangePasswordForm>(initialForm);
  const [isPending, startTransition] = useTransition();

  const handleChange = (field: keyof ChangePasswordForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await changePasswordAction(form);

      if (result.ok) {
        toast.success("Password berhasil diganti.");
        setForm(initialForm);
        setOpen(false);
        return;
      }

      toast.error(result.error.message);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" size="sm" />}>
        <KeyRound className="size-4" />
        Ganti Password
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Ganti Password</DialogTitle>
            <DialogDescription>
              Masukkan password saat ini untuk memastikan perubahan dilakukan oleh pemilik akun.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Password saat ini</Label>
              <Input
                id="currentPassword"
                type="password"
                value={form.currentPassword}
                onChange={(event) => handleChange("currentPassword", event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Password baru</Label>
              <Input
                id="newPassword"
                type="password"
                value={form.newPassword}
                onChange={(event) => handleChange("newPassword", event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <p className="text-xs text-muted-foreground">Minimal 8 karakter dan berbeda dari password saat ini.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Konfirmasi password baru</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(event) => handleChange("confirmPassword", event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              <span className="inline-flex size-4 items-center justify-center">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              </span>
              <span>Simpan Password</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
