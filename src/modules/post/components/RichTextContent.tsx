import type { ReactNode } from "react";

import { isSafePostLink, parseRichTextDocument, type RichTextDocument } from "../utils/rich-content";

type RichTextNode = NonNullable<RichTextDocument["content"]>[number];

type RichTextContentProps = {
  content: string;
  compact?: boolean;
};

export function RichTextContent({ content, compact = false }: RichTextContentProps) {
  const document = parseRichTextDocument(content);

  if (!document) {
    return (
      <p className={compact ? "line-clamp-3 break-all text-sm leading-6 text-muted-foreground" : "break-all whitespace-pre-wrap text-sm leading-7 text-foreground sm:text-base"}>
        {content}
      </p>
    );
  }

  return (
    <div className={compact ? "line-clamp-3 break-all text-sm leading-6 text-muted-foreground" : "break-all space-y-4 text-sm leading-7 text-foreground sm:text-base"}>
      {document.content?.map((node, index) => renderNode(node, index, compact))}
    </div>
  );
}

function renderNode(node: RichTextNode, index: number, compact: boolean): ReactNode {
  const children = node.content?.map((child, childIndex) => renderNode(child, childIndex, compact));

  switch (node.type) {
    case "heading": {
      const level = typeof node.attrs?.level === "number" ? node.attrs.level : 2;
      if (compact) return <span key={index}>{children}</span>;
      if (level <= 2) return <h2 key={index} className="text-xl font-semibold leading-8">{children}</h2>;
      return <h3 key={index} className="text-lg font-semibold leading-7">{children}</h3>;
    }
    case "paragraph":
      return compact ? <span key={index}>{children} </span> : <p key={index}>{children}</p>;
    case "bulletList":
      return compact ? <span key={index}>{children}</span> : <ul key={index} className="ml-5 list-disc space-y-1">{children}</ul>;
    case "orderedList":
      return compact ? <span key={index}>{children}</span> : <ol key={index} className="ml-5 list-decimal space-y-1">{children}</ol>;
    case "listItem":
      return compact ? <span key={index}>{children} </span> : <li key={index}>{children}</li>;
    case "blockquote":
      return compact ? (
        <span key={index}>{children}</span>
      ) : (
        <blockquote key={index} className="border-l-4 border-primary/30 pl-4 text-muted-foreground">
          {children}
        </blockquote>
      );
    case "codeBlock":
      return compact ? (
        <span key={index}>{children}</span>
      ) : (
        <pre key={index} className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs">
          <code>{children}</code>
        </pre>
      );
    case "hardBreak":
      return compact ? " " : <br key={index} />;
    case "text":
      return renderTextNode(node, index);
    default:
      return children;
  }
}

function renderTextNode(node: RichTextNode, index: number): ReactNode {
  let value: ReactNode = node.text ?? "";

  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") value = <strong>{value}</strong>;
    if (mark.type === "italic") value = <em>{value}</em>;
    if (mark.type === "underline") value = <u>{value}</u>;
    if (mark.type === "strike") value = <s>{value}</s>;
    if (mark.type === "code") value = <code className="rounded bg-muted px-1 py-0.5 text-xs">{value}</code>;
    if (mark.type === "link") {
      const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
      if (isSafePostLink(href)) {
        value = (
          <a href={href} target="_blank" rel="noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">
            {value}
          </a>
        );
      }
    }
  }

  return <span key={index}>{value}</span>;
}
