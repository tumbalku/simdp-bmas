"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadProfileAvatarAction } from "@/modules/employee";

const ACCEPTED_PROFILE_IMAGE_TYPES = "image/png,image/jpeg,image/webp";

type ProfileAvatarUploadProps = {
  name: string;
  initials: string;
  avatarUrl: string | null;
  isActive: boolean;
};

export function ProfileAvatarUpload({ name, initials, avatarUrl, isActive }: ProfileAvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadProfileAvatarAction(formData);
      event.target.value = "";

      if (result.ok) {
        toast.success("Foto profil berhasil diperbarui.");
        router.refresh();
        return;
      }

      toast.error(result.error.message);
    });
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        className="group relative rounded-full outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Ganti foto profil"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
      >
        <Avatar size="xl" className="border shadow-sm">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
          <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">{initials}</AvatarFallback>
          {isActive ? <AvatarBadge className="bg-green-600 dark:bg-green-800" /> : null}
        </Avatar>
        <span className="absolute inset-x-0 bottom-0 flex h-9 items-center justify-center rounded-b-full bg-background/85 text-[10px] font-semibold text-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          {isPending ? <Loader2 className="size-3 animate-spin" /> : <Camera className="size-3" />}
          <span className="ml-1">Ganti</span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_PROFILE_IMAGE_TYPES}
        className="sr-only"
        onChange={handleChange}
      />
      <p className="text-[11px] text-muted-foreground">Klik avatar untuk mengunggah foto.</p>
    </div>
  );
}
