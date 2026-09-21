"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, Loader2, Megaphone, Pin, Save, X } from "lucide-react";
import { toast } from "sonner";

import { CardContainer } from "@/components/cards/CardContainer";
import { PageHeader } from "@/components/navigation/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROUTES } from "@/constants";
import {
  POST_STATUS,
  POST_STATUS_OPTIONS,
  POST_VISIBILITY_TYPE,
  POST_VISIBILITY_TYPE_OPTIONS,
  type PostStatus,
} from "@/modules/post";
import { usePostTargetOptions, useUpdatePost } from "../hooks";
import type { PostDetail } from "../types";
import { getPostContentText, isPostContentEmpty, POST_CONTENT_MAX_CHARACTERS } from "../utils/rich-content";
import { RichTextEditor } from "./RichTextEditor";

type PostEditorViewProps = {
  post: PostDetail;
};

export function PostEditorView({ post }: PostEditorViewProps) {
  const router = useRouter();
  const updatePost = useUpdatePost();
  const { data: options, isLoading: optionsLoading } = usePostTargetOptions();
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [status, setStatus] = useState<PostStatus>(post.status as PostStatus);
  const [visibilityType, setVisibilityType] = useState<string>(post.visibilityType);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(post.targets.roles ?? []);
  const [selectedWorkplaces, setSelectedWorkplaces] = useState<string[]>(post.targets.workplaceIds ?? []);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(post.targets.employeeGroupIds ?? []);
  const [selectedUsers, setSelectedUsers] = useState<string[]>(post.targets.userIds ?? []);
  const [isPinned, setIsPinned] = useState(post.isPinned);
  const [sendEmail, setSendEmail] = useState(false);

  const busy = updatePost.isPending;
  const isTargeted = visibilityType === POST_VISIBILITY_TYPE.TARGETED;
  const contentText = getPostContentText(content);
  const contentEmpty = isPostContentEmpty(content);
  const contentTooLong = contentText.length > POST_CONTENT_MAX_CHARACTERS;
  const hasTarget =
    selectedRoles.length > 0 ||
    selectedWorkplaces.length > 0 ||
    selectedGroups.length > 0 ||
    selectedUsers.length > 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || contentEmpty) {
      toast.error("Form belum lengkap", {
        description: "Judul dan isi pengumuman wajib diisi.",
      });
      return;
    }

    if (contentTooLong) {
      toast.error("Isi terlalu panjang", {
        description: `Isi pengumuman maksimal ${POST_CONTENT_MAX_CHARACTERS} karakter.`,
      });
      return;
    }

    if (isTargeted && !hasTarget) {
      toast.error("Target belum dipilih", {
        description: "Pengumuman tertarget wajib memiliki minimal 1 target.",
      });
      return;
    }

    try {
      await updatePost.mutateAsync({
        id: post.id,
        title,
        content,
        visibilityType,
        status,
        isPinned,
        sendEmail,
        targets: {
          roles: selectedRoles,
          workplaceIds: selectedWorkplaces,
          employeeGroupIds: selectedGroups,
          userIds: selectedUsers,
        },
      });
      toast.success("Pengumuman diperbarui");
      router.push(ROUTES.announcementsManage);
    } catch (error) {
      toast.error("Gagal memperbarui pengumuman", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHeader
        eyebrow="Info"
        title="Edit Pengumuman"
        description="Perbarui informasi resmi, target penerima, dan status pengumuman."
        backHref={ROUTES.announcementsManage}
      />

      <CardContainer
        title="Form Pengumuman"
        description="Layout ini mengikuti form buat pengumuman agar proses edit tetap familiar."
        icon={<Megaphone className="size-4" />}
        contentClassName="space-y-4"
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <div className="space-y-2">
            <Label htmlFor="post-title">Judul</Label>
            <Input
              id="post-title"
              placeholder="Judul pengumuman"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              disabled={busy}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as PostStatus)} disabled={busy}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                {POST_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="post-content">Isi Pengumuman</Label>
          <RichTextEditor
            id="post-content"
            value={content}
            onChange={setContent}
            disabled={busy}
          />
        </div>

        <div className="space-y-2">
          <Label>Visibilitas</Label>
          <Select
            value={visibilityType}
            onValueChange={(value) => setVisibilityType(value ?? POST_VISIBILITY_TYPE.PUBLIC)}
            disabled={busy}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih visibilitas" />
            </SelectTrigger>
            <SelectContent>
              {POST_VISIBILITY_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isTargeted ? (
          <div className="space-y-4 rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Target Penerima</p>
              <p className="text-xs text-muted-foreground">
                Pilih minimal 1 target untuk pengumuman dengan visibilitas target tertentu.
              </p>
            </div>
            <TargetPicker
              label="Role"
              options={options?.roles ?? []}
              selected={selectedRoles}
              onChange={setSelectedRoles}
              loading={optionsLoading}
              disabled={busy}
            />
            <TargetPicker
              label="Unit Kerja"
              options={options?.workplaces ?? []}
              selected={selectedWorkplaces}
              onChange={setSelectedWorkplaces}
              loading={optionsLoading}
              disabled={busy}
            />
            <TargetPicker
              label="Kelompok Pegawai"
              options={options?.employeeGroups ?? []}
              selected={selectedGroups}
              onChange={setSelectedGroups}
              loading={optionsLoading}
              disabled={busy}
            />
            <TargetPicker
              label="User Individual"
              options={options?.users ?? []}
              selected={selectedUsers}
              onChange={setSelectedUsers}
              loading={optionsLoading}
              disabled={busy}
            />
            {!hasTarget ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Pilih minimal 1 target sebelum menyimpan.
              </p>
            ) : null}
          </div>
        ) : null}

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/10 p-3 text-sm">
          <Checkbox
            checked={isPinned}
            onCheckedChange={setIsPinned}
            disabled={busy}
            aria-label="Sematkan pengumuman di bagian atas feed"
            className="mt-0.5"
          />
          <span className="space-y-1">
            <span className="flex items-center gap-2 font-medium">
              <Pin className="size-3.5" />
              Sematkan pengumuman
            </span>
            <span className="block text-xs leading-5 text-muted-foreground">
              Pengumuman yang disematkan muncul lebih dulu di halaman pengumuman.
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/10 p-3 text-sm">
          <Checkbox
            checked={sendEmail}
            onCheckedChange={setSendEmail}
            disabled={busy || post.status === POST_STATUS.PUBLISHED}
            aria-label="Kirim salinan pengumuman lewat email"
            className="mt-0.5"
          />
          <span className="space-y-1">
            <span className="block font-medium">Kirim salinan lewat email</span>
            <span className="block text-xs leading-5 text-muted-foreground">
              Email hanya dikirim saat status berubah menjadi dipublikasikan.
            </span>
          </span>
        </label>

        {post.attachments.length ? (
          <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
            <p className="text-sm font-medium">Lampiran Saat Ini</p>
            <div className="flex flex-wrap gap-2">
              {post.attachments.map((attachment) => (
                <Button
                  key={attachment.id}
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<a href={attachment.url} target="_blank" rel="noreferrer" />}
                >
                  <FileText className="size-3.5" />
                  {attachment.fileName}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" nativeButton={false} render={<Link href={ROUTES.announcementsManage} />}>
            Batal
          </Button>
          <Button type="submit" disabled={busy || !title.trim() || contentEmpty || contentTooLong || (isTargeted && !hasTarget)}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Simpan Perubahan
          </Button>
        </div>
      </CardContainer>
    </form>
  );
}

type TargetPickerProps = {
  label: string;
  options: Array<{ id: string; name: string }>;
  selected: string[];
  onChange: (values: string[]) => void;
  loading?: boolean;
  disabled?: boolean;
};

function TargetPicker({
  label,
  options,
  selected,
  onChange,
  loading,
  disabled,
}: TargetPickerProps) {
  const available = options.filter((option) => !selected.includes(option.id));

  function handleAdd(value: string | null) {
    if (!value || selected.includes(value)) return;
    onChange([...selected, value]);
  }

  function handleRemove(value: string) {
    onChange(selected.filter((item) => item !== value));
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      {loading ? (
        <p className="text-xs text-muted-foreground">Memuat opsi...</p>
      ) : available.length ? (
        <Select onValueChange={handleAdd} disabled={disabled} value="">
          <SelectTrigger>
            <SelectValue placeholder={`Tambah ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {available.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-xs text-muted-foreground">Tidak ada opsi tersisa.</p>
      )}

      {selected.length ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((id) => {
            const option = options.find((item) => item.id === id);
            return (
              <Badge key={id} variant="secondary" className="gap-1">
                {option?.name ?? id}
                <button
                  type="button"
                  onClick={() => handleRemove(id)}
                  className="rounded-sm hover:bg-muted-foreground/20"
                  aria-label={`Hapus ${option?.name ?? id}`}
                  disabled={disabled}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
