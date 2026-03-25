"use client";

import { useEffect, useRef } from "react";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";
import { Editor, Element as SlateElement, Transforms } from "slate";
import type { PlateContent as PlateValue } from "@/types";
import { Button } from "@/components/ui/button";
import { fingerprint } from "@/lib/utils/plate-normalize";

type CustomElement = {
  type: string;
  children: CustomText[];
};

type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

interface PlateEditorProps {
  documentId: string;
  initialContent: PlateValue;
  onChange: (value: PlateValue) => void;
  editable?: boolean;
}

const LIST_TYPES = ["bulleted-list", "numbered-list"] as const;

function ToolbarButton({
  active,
  label,
  onClick,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="min-w-9"
    >
      {label}
    </Button>
  );
}

function isMarkActive(editorRef: unknown, format: keyof CustomText) {
  const editor = editorRef as Editor;
  const marks = Editor.marks(editor) as Partial<CustomText> | null;
  return marks ? marks[format] === true : false;
}

function toggleMark(editorRef: unknown, format: keyof CustomText) {
  const editor = editorRef as Editor;
  if (isMarkActive(editor, format)) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
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
      return <h1 {...attributes} className="mb-3 text-3xl font-bold">{children}</h1>;
    case "h2":
      return <h2 {...attributes} className="mb-2 text-2xl font-semibold">{children}</h2>;
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
  return <span {...attributes}>{out}</span>;
}

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

  return (
    <div className="mt-4 flex min-h-[500px] flex-col rounded-xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
        <ToolbarButton label="B" active={isMarkActive(editor, "bold")} onClick={() => toggleMark(editor, "bold")} />
        <ToolbarButton label="I" active={isMarkActive(editor, "italic")} onClick={() => toggleMark(editor, "italic")} />
        <ToolbarButton label="U" active={isMarkActive(editor, "underline")} onClick={() => toggleMark(editor, "underline")} />
        <div className="mx-1 h-6 w-px bg-border" />
        <ToolbarButton label="H1" active={isBlockActive(editor, "h1")} onClick={() => toggleBlock(editor, "h1")} />
        <ToolbarButton label="H2" active={isBlockActive(editor, "h2")} onClick={() => toggleBlock(editor, "h2")} />
        <ToolbarButton label="List" active={isBlockActive(editor, "bulleted-list")} onClick={() => toggleBlock(editor, "bulleted-list")} />
        <ToolbarButton label="1." active={isBlockActive(editor, "numbered-list")} onClick={() => toggleBlock(editor, "numbered-list")} />
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
            readOnly={!editable}
            renderElement={renderElement as never}
            renderLeaf={renderLeaf as never}
            onKeyDown={(event) => {
              if (!event.ctrlKey && !event.metaKey) return;
              const key = event.key.toLowerCase();
              if (key === "b" || key === "i" || key === "u") event.preventDefault();
              if (key === "b") toggleMark(editor, "bold");
              if (key === "i") toggleMark(editor, "italic");
              if (key === "u") toggleMark(editor, "underline");
            }}
            placeholder="Start writing your document..."
          />
        </Plate>
      </div>
    </div>
  );
}
