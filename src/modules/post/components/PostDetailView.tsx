"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, FileText, Pencil, Pin, Trash2, User } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/navigation/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES, routeTo } from "@/constants";
import { useDeletePost } from "../hooks";
import type { PostDetail } from "../types";
import { RichTextContent } from "./RichTextContent";

type PostDetailViewProps = {
  post: PostDetail;
  canEdit?: boolean;
  canDelete?: boolean;
};

export function PostDetailView({ post, canEdit = false, canDelete = false }: PostDetailViewProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deletePost = useDeletePost();
  const imageAttachments = post.attachments.filter((attachment) => attachment.mimeType.startsWith("image/"));
  const fileAttachments = post.attachments.filter((attachment) => !attachment.mimeType.startsWith("image/"));
  const coverImage = imageAttachments[0];
  const galleryImages = imageAttachments.slice(1);
  const publishedAt = post.publishedAt ?? post.createdAt;

  async function handleDelete() {
    try {
      await deletePost.mutateAsync(post.id);
      toast.success("Pengumuman dihapus", { description: post.title });
      router.push(ROUTES.announcements);
    } catch (error) {
      toast.error("Gagal menghapus pengumuman", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Info"
        title={post.title}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {`Dipublikasikan pada ${formatPublicationDate(publishedAt)}`}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <User className="size-3.5" />
              {`Oleh ${post.authorName}`}
            </span>
          </span>
        }
        actions={[
          ...(canEdit
            ? [
                {
                  label: "Edit",
                  icon: <Pencil className="size-4" />,
                  href: routeTo.announcementsManageEdit(post.id),
                  variant: "outline" as const,
                },
              ]
            : []),
          ...(canDelete
            ? [
                {
                  label: "Hapus",
                  icon: <Trash2 className="size-4" />,
                  onClick: () => setDeleteDialogOpen(true),
                  variant: "destructive" as const,
                },
              ]
            : []),
        ]}
        trailing={
          post.isPinned ? (
            <Badge variant="secondary" className="gap-1">
              <Pin className="size-3" />
              Disematkan
            </Badge>
          ) : null
        }
      />

      <Card className="gap-0">
        <article>
          <CardContent className="space-y-8 px-5 sm:px-6">

        {coverImage ? (
          <figure className="overflow-hidden rounded-lg border bg-muted/20">
            <Image
              src={coverImage.url}
              alt={coverImage.fileName}
              width={960}
              height={540}
              unoptimized
              className="max-h-[540px] w-full object-cover"
            />
            <figcaption className="border-t bg-card px-4 py-2 text-xs text-muted-foreground">
              {coverImage.fileName}
            </figcaption>
          </figure>
        ) : null}

        <div>
          <RichTextContent content={post.content} />
        </div>

        {galleryImages.length ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3 border-b pb-2">
              <h2 className="text-base font-semibold text-foreground">Galeri Foto</h2>
              <span className="text-xs text-muted-foreground">{galleryImages.length} gambar</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {galleryImages.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-md border bg-muted/20"
                >
                  <Image
                    src={attachment.url}
                    alt={attachment.fileName}
                    width={480}
                    height={300}
                    unoptimized
                    className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                  <span className="block truncate px-3 py-2 text-xs text-muted-foreground">
                    {attachment.fileName}
                  </span>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {fileAttachments.length ? (
          <section className="space-y-3 rounded-lg border bg-muted/10 p-4">
            <h2 className="text-base font-semibold text-foreground">Dokumen Lampiran</h2>
            <div className="flex flex-wrap gap-2">
              {fileAttachments.map((attachment) => (
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
          </section>
        ) : null}
          </CardContent>
        </article>
      </Card>

      <AlertDialog open={canDelete && deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Hapus pengumuman?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengumuman &quot;{post.title}&quot; akan dihapus dari daftar aktif.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePost.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletePost.isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function formatPublicationDate(iso: string) {
  try {
    const date = new Date(iso);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return iso;
  }
}
