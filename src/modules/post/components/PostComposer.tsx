"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, FileText, FileUp, ImageIcon, Loader2, Megaphone, Pin, X } from "lucide-react";
import { toast } from "sonner";

import { CardContainer } from "@/components/cards/CardContainer";
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
import { Badge } from "@/components/ui/badge";
import {
  POST_VISIBILITY_TYPE,
  POST_VISIBILITY_TYPE_OPTIONS,
  type PostAttachmentLimits,
} from "@/modules/post";
import { usePostTargetOptions } from "../hooks";
import { useCreatePost, type PostFormValues } from "../hooks/post.hooks";
import { isPostContentEmpty, POST_CONTENT_MAX_CHARACTERS, getPostContentText } from "../utils/rich-content";
import { RichTextEditor } from "./RichTextEditor";

type ComposerProps = {
  attachmentLimits: PostAttachmentLimits;
  onSaved?: () => void;
};

export function PostComposer({ attachmentLimits, onSaved }: ComposerProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibilityType, setVisibilityType] = useState<string>(POST_VISIBILITY_TYPE.PUBLIC);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedWorkplaces, setSelectedWorkplaces] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

  const { data: options, isLoading: optionsLoading } = usePostTargetOptions();
  const createPost = useCreatePost();

  const isTargeted = visibilityType === POST_VISIBILITY_TYPE.TARGETED;
  const contentText = getPostContentText(content);
  const contentEmpty = isPostContentEmpty(content);
  const contentTooLong = contentText.length > POST_CONTENT_MAX_CHARACTERS;
  const hasTarget =
    selectedRoles.length > 0 ||
    selectedWorkplaces.length > 0 ||
    selectedGroups.length > 0 ||
    selectedUsers.length > 0;

  function resetForm() {
    setTitle("");
    setContent("");
    setVisibilityType(POST_VISIBILITY_TYPE.PUBLIC);
    setSelectedRoles([]);
    setSelectedWorkplaces([]);
    setSelectedGroups([]);
    setSelectedUsers([]);
    setFiles([]);
    setIsPinned(false);
    setSendEmail(false);
  }

  function buildValues(status: "DRAFT" | "PUBLISHED"): PostFormValues {
    return {
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
      files,
    };
  }

  async function handleSave(status: "DRAFT" | "PUBLISHED") {
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

    const maxBytes = attachmentLimits.maxFileSizeMb * 1024 * 1024;
    if (files.length > attachmentLimits.maxFiles) {
      toast.error("Lampiran terlalu banyak", {
        description: `Maksimal ${attachmentLimits.maxFiles} file per pengumuman.`,
      });
      return;
    }

    const oversized = files.find((file) => file.size > maxBytes);
    if (oversized) {
      toast.error("Ukuran lampiran terlalu besar", {
        description: `${oversized.name} melebihi ${attachmentLimits.maxFileSizeMb} MB.`,
      });
      return;
    }

    try {
      await createPost.mutateAsync(buildValues(status));
      toast.success(status === "PUBLISHED" ? "Pengumuman dipublikasikan" : "Draft disimpan");
      resetForm();
      onSaved?.();
    } catch (error) {
      toast.error("Gagal menyimpan pengumuman", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    }
  }

  const busy = createPost.isPending;

  function handleVisibilityChange(value: string | null) {
    setVisibilityType(value ?? POST_VISIBILITY_TYPE.PUBLIC);
  }

  function handleFilesChange(nextFiles: FileList | null) {
    const merged = [...files, ...Array.from(nextFiles ?? [])];
    const unique = merged.filter(
      (file, index, all) =>
        all.findIndex((candidate) => candidate.name === file.name && candidate.size === file.size) === index,
    );
    if (unique.length > attachmentLimits.maxFiles) {
      toast.error("Sebagian lampiran tidak ditambahkan", {
        description: `Maksimal ${attachmentLimits.maxFiles} file per pengumuman.`,
      });
    }
    setFiles(unique.slice(0, attachmentLimits.maxFiles));
  }

  function handleFileRemove(fileToRemove: File) {
    setFiles((current) =>
      current.filter((file) => file.name !== fileToRemove.name || file.size !== fileToRemove.size),
    );
  }

  function handleFileMove(index: number, direction: -1 | 1) {
    setFiles((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  return (
    <CardContainer
      title="Buat Pengumuman"
      description="Tulis informasi resmi, pilih audiens, lalu simpan sebagai draft atau publikasikan."
      icon={<Megaphone className="size-4" />}
      contentClassName="space-y-4"
    >
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
          <Select value={visibilityType} onValueChange={handleVisibilityChange} disabled={busy}>
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

        <div className="space-y-2">
          <Label htmlFor="post-attachments">Lampiran gambar atau file</Label>
          <p className="text-xs leading-5 text-muted-foreground">
            Urutan lampiran menentukan layout pengumuman: gambar pertama menjadi cover utama, gambar berikutnya masuk galeri,
            dan file non-gambar tampil sebagai dokumen lampiran.
          </p>
          <label
            htmlFor="post-attachments"
            className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 px-4 py-5 text-center transition-colors hover:bg-muted/30"
          >
            <span className="inline-flex size-9 items-center justify-center rounded-md border bg-background text-muted-foreground">
              <FileUp className="size-4" />
            </span>
            <span className="text-sm font-medium">Pilih gambar atau file</span>
            <span className="text-xs text-muted-foreground">
              Maksimal {attachmentLimits.maxFiles} file, {attachmentLimits.maxFileSizeMb} MB per file.
            </span>
          </label>
          <Input
            id="post-attachments"
            type="file"
            multiple
            disabled={busy}
            className="sr-only"
            onChange={(event) => {
              handleFilesChange(event.target.files);
              event.target.value = "";
            }}
          />
          {files.length ? (
            <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Atur Lampiran</p>
                <p className="text-xs text-muted-foreground">{files.length} file dipilih</p>
              </div>
              {files.map((file, index) => {
                const imageIndex = files.slice(0, index + 1).filter((item) => item.type.startsWith("image/")).length;
                const isImage = file.type.startsWith("image/");
                const layoutLabel = isImage
                  ? imageIndex === 1
                    ? "Cover pengumuman"
                    : `Galeri foto ${imageIndex - 1}`
                  : "Dokumen lampiran";

                return (
                  <div key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3 rounded-md border bg-background p-2 text-sm">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/30 text-muted-foreground">
                        {isImage ? <ImageIcon className="size-4" /> : <FileText className="size-4" />}
                      </span>
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="truncate font-medium">{file.name}</span>
                          <Badge variant={isImage && imageIndex === 1 ? "default" : "secondary"} className="shrink-0">
                            {layoutLabel}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleFileMove(index, -1)}
                        disabled={busy || index === 0}
                        aria-label={`Naikkan urutan ${file.name}`}
                      >
                        <ArrowUp className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleFileMove(index, 1)}
                        disabled={busy || index === files.length - 1}
                        aria-label={`Turunkan urutan ${file.name}`}
                      >
                        <ArrowDown className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleFileRemove(file)}
                        disabled={busy}
                        aria-label={`Hapus lampiran ${file.name}`}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {isTargeted ? (
          <div className="space-y-4 rounded-lg border p-4">
            <p className="text-sm font-medium">Target Penerima</p>
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
            {!hasTarget && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Pilih minimal 1 target sebelum mempublikasikan.
              </p>
            )}
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
            disabled={busy}
            aria-label="Kirim salinan pengumuman lewat email"
            className="mt-0.5"
          />
          <span className="space-y-1">
            <span className="block font-medium">Kirim salinan lewat email</span>
            <span className="block text-xs leading-5 text-muted-foreground">
              Email hanya dikirim saat pengumuman dipublikasikan.
            </span>
          </span>
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSave("DRAFT")}
            disabled={busy || !title.trim() || contentEmpty || contentTooLong}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            Simpan Draft
          </Button>
          <Button
            type="button"
            onClick={() => handleSave("PUBLISHED")}
            disabled={busy || !title.trim() || contentEmpty || contentTooLong || (isTargeted && !hasTarget)}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            Publikasikan
          </Button>
        </div>
    </CardContainer>
  );
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
