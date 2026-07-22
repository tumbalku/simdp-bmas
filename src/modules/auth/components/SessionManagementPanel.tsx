"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Laptop, Loader2, LogOut, ShieldAlert, Smartphone } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROUTES } from "@/constants";
import { revokeAllSessionsAction, revokeSessionAction } from "@/modules/auth";

export type SessionListItem = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date | string;
  expiresAt: Date | string;
};

type SessionManagementPanelProps = {
  sessions: SessionListItem[];
};

export function SessionManagementPanel({ sessions }: SessionManagementPanelProps) {
  const router = useRouter();
  const [pendingTokenId, setPendingTokenId] = useState<string | null>(null);
  const [isRevokeAllPending, startRevokeAllTransition] = useTransition();
  const [isRevokePending, startRevokeTransition] = useTransition();

  const handleRevokeSession = (tokenId: string) => {
    setPendingTokenId(tokenId);

    startRevokeTransition(async () => {
      const result = await revokeSessionAction(tokenId);

      if (result.ok) {
        toast.success("Sesi berhasil dicabut.");
        router.refresh();
        setPendingTokenId(null);
        return;
      }

      toast.error(result.error.message);
      setPendingTokenId(null);
    });
  };

  const handleRevokeAllSessions = () => {
    startRevokeAllTransition(async () => {
      const result = await revokeAllSessionsAction();

      if (result.ok) {
        toast.success("Semua sesi berhasil dicabut. Silakan login kembali.");
        router.push(ROUTES.login);
        router.refresh();
        return;
      }

      toast.error(result.error.message);
    });
  };

  return (
    <div className="space-y-4">
      <Alert className="border-primary/20 bg-primary/5">
        <ShieldAlert className="size-4 text-primary" />
        <AlertTitle>Sesi aktif akun</AlertTitle>
        <AlertDescription>
          SIMDP menerapkan satu sesi aktif per akun. Jika melihat perangkat atau lokasi yang tidak dikenal, cabut sesi
          lalu ganti password.
        </AlertDescription>
      </Alert>

      {sessions.length === 0 ? (
        <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
          Belum ada sesi refresh aktif. Login ulang akan membuat sesi baru.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Perangkat</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>Kedaluwarsa</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => {
                const device = describeUserAgent(session.userAgent);
                const isPending = isRevokePending && pendingTokenId === session.id;

                return (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {device.kind === "mobile" ? (
                          <Smartphone className="size-4 text-muted-foreground" />
                        ) : (
                          <Laptop className="size-4 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-medium">{device.label}</div>
                          <div className="max-w-[240px] truncate text-muted-foreground" title={session.userAgent ?? ""}>
                            {session.userAgent || "User agent tidak tersedia"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{session.ipAddress || "Tidak diketahui"}</Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(session.createdAt)}</TableCell>
                    <TableCell>{formatDateTime(session.expiresAt)}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger render={<Button type="button" size="sm" variant="outline" />}>
                          Cabut
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cabut sesi ini?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Perangkat terkait akan diminta login kembali saat token aksesnya habis atau saat mencoba
                              memperbarui sesi.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              type="button"
                              variant="destructive"
                              disabled={isPending}
                              onClick={() => handleRevokeSession(session.id)}
                            >
                              {isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
                              Cabut Sesi
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold">Cabut semua sesi</div>
          <p className="text-xs text-muted-foreground">
            Mengakhiri semua sesi refresh aktif dan mengeluarkan akun ini dari browser sekarang.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger
            render={<Button type="button" size="sm" variant="destructive" disabled={isRevokeAllPending} />}
          >
            {isRevokeAllPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            Cabut Semua
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cabut semua sesi?</AlertDialogTitle>
              <AlertDialogDescription>
                Semua perangkat akan keluar dari akun ini. Anda akan diarahkan ke halaman login.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRevokeAllPending}>Batal</AlertDialogCancel>
              <AlertDialogAction
                type="button"
                variant="destructive"
                disabled={isRevokeAllPending}
                onClick={handleRevokeAllSessions}
              >
                {isRevokeAllPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
                Cabut Semua Sesi
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function describeUserAgent(userAgent: string | null) {
  if (!userAgent) return { label: "Perangkat tidak dikenal", kind: "desktop" as const };

  const lower = userAgent.toLowerCase();
  const kind = /android|iphone|ipad|mobile/.test(lower) ? "mobile" : "desktop";

  if (lower.includes("chrome")) return { label: kind === "mobile" ? "Chrome Mobile" : "Chrome", kind };
  if (lower.includes("firefox")) return { label: "Firefox", kind };
  if (lower.includes("safari")) return { label: kind === "mobile" ? "Safari Mobile" : "Safari", kind };
  if (lower.includes("edge")) return { label: "Microsoft Edge", kind };

  return { label: kind === "mobile" ? "Perangkat mobile" : "Browser desktop", kind };
}

function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

