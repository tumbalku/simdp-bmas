"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import type { JSONContent } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  RemoveFormatting,
  Underline as UnderlineIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import {
  getPostContentText,
  POST_CONTENT_MAX_CHARACTERS,
  toEditorDocument,
} from "../utils/rich-content";

type RichTextEditorProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function RichTextEditor({
  id,
  value,
  onChange,
  disabled,
  placeholder = "Tulis isi pengumuman di sini...",
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      LinkExtension.configure({
        autolink: true,
        openOnClick: false,
        defaultProtocol: "https",
        protocols: ["http", "https", "mailto"],
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: toEditorDocument(value) as JSONContent,
    editorProps: {
      attributes: {
        id: id ?? "post-content",
        class:
          "min-h-48 rounded-b-md border-x border-b bg-background px-3 py-3 text-sm leading-6 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:leading-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:leading-7 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_li]:pl-1",
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      onChange(JSON.stringify(nextEditor.getJSON()));
    },
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const characterCount = getPostContentText(value).length;

  if (!editor) {
    return (
      <div className="min-h-48 rounded-md border bg-muted/20" />
    );
  }

  function setLink() {
    if (!editor) return;
    const current = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Masukkan URL link", current ?? "https://");

    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
  }

  function isCurrentTextBlockEmpty() {
    if (!editor) return true;
    return editor.state.selection.$from.parent.textContent.trim().length === 0;
  }

  function toggleBulletList() {
    if (!editor) return;

    if (editor.isActive("orderedList") && isCurrentTextBlockEmpty()) {
      const nested = editor.chain().focus().sinkListItem("listItem").toggleBulletList().run();
      if (nested) return;
    }

    editor.chain().focus().toggleBulletList().run();
  }

  function toggleOrderedList() {
    if (!editor) return;

    if (editor.isActive("bulletList") && isCurrentTextBlockEmpty()) {
      const nested = editor.chain().focus().sinkListItem("listItem").toggleOrderedList().run();
      if (nested) return;
    }

    editor.chain().focus().toggleOrderedList().run();
  }

  function indentListItem() {
    if (!editor) return;
    editor.chain().focus().sinkListItem("listItem").run();
  }

  function outdentListItem() {
    if (!editor) return;
    editor.chain().focus().liftListItem("listItem").run();
  }

  return (
    <div className={cn(disabled && "opacity-70")}>
      <div className="flex flex-wrap gap-1 rounded-t-md border bg-muted/20 p-1">
        <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} disabled={disabled} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Heading 3" active={editor.isActive("heading", { level: 3 })} disabled={disabled} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Bold" active={editor.isActive("bold")} disabled={disabled} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive("italic")} disabled={disabled} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Underline" active={editor.isActive("underline")} disabled={disabled} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} disabled={disabled} onClick={toggleBulletList}>
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} disabled={disabled} onClick={toggleOrderedList}>
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Indent list item" disabled={disabled || !editor.isActive("listItem")} onClick={indentListItem}>
          <IndentIncrease className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Outdent list item" disabled={disabled || !editor.isActive("listItem")} onClick={outdentListItem}>
          <IndentDecrease className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Quote" active={editor.isActive("blockquote")} disabled={disabled} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Link" active={editor.isActive("link")} disabled={disabled} onClick={setLink}>
          <Link className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Clear formatting" disabled={disabled} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          <RemoveFormatting className="size-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
      <div className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Gunakan Tab/Shift+Tab atau tombol indent/outdent untuk membuat bullet di bawah numbering tanpa mereset nomor.
        </p>
        <p className="shrink-0">
          {characterCount}/{POST_CONTENT_MAX_CHARACTERS} karakter
        </p>
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className="size-8"
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  );
}
