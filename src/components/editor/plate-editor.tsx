"use client";

import { useEffect, useRef } from "react";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";
import { Editor, Element as SlateElement, Transforms } from "slate";
import type { PlateContent as PlateValue } from "@/types";
import { fingerprint } from "@/lib/utils/plate-normalize";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  RemoveFormatting,
} from "lucide-react";

type CustomElement = {
  type: string;
  children: CustomText[];
};

type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
};

interface PlateEditorProps {
  documentId: string;
  initialContent: PlateValue;
  onChange: (value: PlateValue) => void;
  editable?: boolean;
}

const LIST_TYPES = ["bulleted-list", "numbered-list"] as const;

type MarkFormat = "bold" | "italic" | "underline" | "strikethrough" | "code";

function ToolbarBtn({
  active,
  title,
  disabled,
  onClick,
  children,
}: {
  active?: boolean;
  title: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-border" />;
}

function isMarkActive(editorRef: unknown, format: MarkFormat) {
  const editor = editorRef as Editor;
  const marks = Editor.marks(editor) as Partial<CustomText> | null;
  return marks ? marks[format] === true : false;
}

function toggleMark(editorRef: unknown, format: MarkFormat) {
  const editor = editorRef as Editor;
  if (isMarkActive(editor, format)) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
}

function clearMarks(editorRef: unknown) {
  const editor = editorRef as Editor;
  const formats: MarkFormat[] = ["bold", "italic", "underline", "strikethrough", "code"];
  formats.forEach((f) => Editor.removeMark(editor, f));
}

function isBlockActive(editorRef: unknown, format: string) {
  const editor = editorRef as Editor;
  const matches = Editor.nodes(editor, {
    match: (node) =>
      !Editor.isEditor(node) &&
      SlateElement.isElement(node) &&
      "type" in node &&
      node.type === format,
  });
  return !!matches.next().value;
}

function toggleBlock(editorRef: unknown, format: string) {
  const editor = editorRef as Editor;
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format as (typeof LIST_TYPES)[number]);

  Transforms.unwrapNodes(editor, {
    match: (node) =>
      !Editor.isEditor(node) &&
      SlateElement.isElement(node) &&
      "type" in node &&
      LIST_TYPES.includes(node.type as (typeof LIST_TYPES)[number]),
    split: true,
  });

  Transforms.setNodes<CustomElement>(editor, {
    type: isActive ? "p" : isList ? "list-item" : format,
  });

  if (!isActive && isList) {
    Transforms.wrapNodes(editor, {
      type: format,
      children: [],
    } as CustomElement);
  }
}

function renderElement({
  attributes,
  children,
  element,
}: {
  attributes: Record<string, unknown>;
  children: React.ReactNode;
  element: unknown;
}) {
  const el = element as CustomElement;
  switch (el.type) {
    case "h1":
      return <h1 {...attributes} className="mb-4 text-3xl font-bold leading-tight">{children}</h1>;
    case "h2":
      return <h2 {...attributes} className="mb-3 text-2xl font-semibold leading-snug">{children}</h2>;
    case "blockquote":
      return (
        <blockquote {...attributes} className="mb-4 border-l-4 border-border pl-4 italic text-muted-foreground">
          {children}
        </blockquote>
      );
    case "bulleted-list":
      return <ul {...attributes} className="mb-4 list-disc pl-6">{children}</ul>;
    case "numbered-list":
      return <ol {...attributes} className="mb-4 list-decimal pl-6">{children}</ol>;
    case "list-item":
      return <li {...attributes} className="mb-1">{children}</li>;
    default:
      return <p {...attributes} className="mb-3 leading-7">{children}</p>;
  }
}

function renderLeaf({
  attributes,
  children,
  leaf,
}: {
  attributes: Record<string, unknown>;
  children: React.ReactNode;
  leaf: unknown;
}) {
  const l = leaf as CustomText;
  let out = children;
  if (l.bold) out = <strong>{out}</strong>;
  if (l.italic) out = <em>{out}</em>;
  if (l.underline) out = <u>{out}</u>;
  if (l.strikethrough) out = <s>{out}</s>;
  if (l.code) out = <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">{out}</code>;
  return <span {...attributes}>{out}</span>;
}

const ICON = "h-4 w-4";

export function PlateEditor({
  documentId,
  initialContent,
  onChange,
  editable = true,
}: PlateEditorProps) {
  const editor = usePlateEditor({ value: initialContent as never }, [documentId]);
  const lastAppliedFp = useRef(fingerprint(initialContent));

  useEffect(() => {
    if (!editor) return;

    const incomingFp = fingerprint(initialContent);
    if (incomingFp === lastAppliedFp.current) return;

    const currentFp = fingerprint(editor.children as PlateValue);
    if (incomingFp === currentFp) {
      lastAppliedFp.current = incomingFp;
      return;
    }

    lastAppliedFp.current = incomingFp;
    editor.tf.setValue(initialContent as never);
  }, [initialContent, editor]);

  if (!editor) return null;

  const ro = !editable;

  return (
    <div className="flex min-h-[500px] flex-col rounded-xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-1 border-b px-3 py-2">
        <ToolbarBtn
          title="Undo (Ctrl+Z)"
          disabled={ro}
          onClick={() => (editor as unknown as { undo: () => void }).undo?.()}
        >
          <Undo2 className={ICON} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Redo (Ctrl+Y)"
          disabled={ro}
          onClick={() => (editor as unknown as { redo: () => void }).redo?.()}
        >
          <Redo2 className={ICON} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn title="Bold (Ctrl+B)" active={isMarkActive(editor, "bold")} disabled={ro} onClick={() => toggleMark(editor, "bold")}>
          <Bold className={ICON} />
        </ToolbarBtn>
        <ToolbarBtn title="Italic (Ctrl+I)" active={isMarkActive(editor, "italic")} disabled={ro} onClick={() => toggleMark(editor, "italic")}>
          <Italic className={ICON} />
        </ToolbarBtn>
        <ToolbarBtn title="Underline (Ctrl+U)" active={isMarkActive(editor, "underline")} disabled={ro} onClick={() => toggleMark(editor, "underline")}>
          <Underline className={ICON} />
        </ToolbarBtn>
        <ToolbarBtn title="Strikethrough" active={isMarkActive(editor, "strikethrough")} disabled={ro} onClick={() => toggleMark(editor, "strikethrough")}>
          <Strikethrough className={ICON} />
        </ToolbarBtn>
        <ToolbarBtn title="Inline code" active={isMarkActive(editor, "code")} disabled={ro} onClick={() => toggleMark(editor, "code")}>
          <Code className={ICON} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn title="Heading 1" active={isBlockActive(editor, "h1")} disabled={ro} onClick={() => toggleBlock(editor, "h1")}>
          <Heading1 className={ICON} />
        </ToolbarBtn>
        <ToolbarBtn title="Heading 2" active={isBlockActive(editor, "h2")} disabled={ro} onClick={() => toggleBlock(editor, "h2")}>
          <Heading2 className={ICON} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn title="Bullet list" active={isBlockActive(editor, "bulleted-list")} disabled={ro} onClick={() => toggleBlock(editor, "bulleted-list")}>
          <List className={ICON} />
        </ToolbarBtn>
        <ToolbarBtn title="Numbered list" active={isBlockActive(editor, "numbered-list")} disabled={ro} onClick={() => toggleBlock(editor, "numbered-list")}>
          <ListOrdered className={ICON} />
        </ToolbarBtn>
        <ToolbarBtn title="Blockquote" active={isBlockActive(editor, "blockquote")} disabled={ro} onClick={() => toggleBlock(editor, "blockquote")}>
          <Quote className={ICON} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn title="Clear formatting" disabled={ro} onClick={() => clearMarks(editor)}>
          <RemoveFormatting className={ICON} />
        </ToolbarBtn>
      </div>

      <div className="flex-1 p-6">
        <Plate
          editor={editor}
          onChange={({ value }) => {
            onChange(value as PlateValue);
          }}
        >
          <PlateContent
            className="min-h-[420px] outline-none"
            readOnly={ro}
            renderElement={renderElement as never}
            renderLeaf={renderLeaf as never}
            onKeyDown={(event) => {
              if (!event.ctrlKey && !event.metaKey) return;
              const key = event.key.toLowerCase();
              const prevent = ["b", "i", "u"];
              if (prevent.includes(key)) event.preventDefault();
              if (key === "b") toggleMark(editor, "bold");
              if (key === "i") toggleMark(editor, "italic");
              if (key === "u") toggleMark(editor, "underline");
            }}
            placeholder="Start writing..."
          />
        </Plate>
      </div>
    </div>
  );
}
