"use client";

import React from "react";
import { EditorContent, mergeAttributes, Node, useEditor, type JSONContent } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button/Button";

export type TemplateMessagePart =
  | {
      type: "TEXT";
      text: string;
    }
  | {
      type: "VARIABLE";
      key: string;
    };

export type TemplateVariableOption = {
  key: string;
  label: string;
};

type TemplateVariableEditorProps = {
  id?: string;
  value: TemplateMessagePart[];
  variables: TemplateVariableOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
  className?: string;
  onChange: (value: TemplateMessagePart[]) => void;
};

const TemplateVariableNode = Node.create({
  name: "templateVariable",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      key: {
        default: "",
        parseHTML: (element: HTMLElement) => element.dataset.templateVariable ?? "",
      },
      label: {
        default: "",
        parseHTML: (element: HTMLElement) => element.textContent ?? "",
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-template-variable]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-template-variable": node.attrs.key,
        class:
          "mx-0.5 inline-flex rounded-md border border-brand-200 bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-700",
        contenteditable: "false",
      }),
      node.attrs.label,
    ];
  },
});

export function TemplateVariableEditor({
  id,
  value,
  variables,
  placeholder = "내용을 입력해 주세요.",
  disabled = false,
  error = false,
  hint,
  className,
  onChange,
}: TemplateVariableEditorProps) {
  const variableLabels = React.useMemo(
    () => new Map(variables.map((variable) => [variable.key, variable.label])),
    [variables],
  );
  const lastValueSignatureRef = React.useRef(partsSignature(value));
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit,
      TemplateVariableNode,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: partsToContent(value, variableLabels),
    editorProps: {
      attributes: {
        id: id ?? "",
        class: cn(
          "min-h-52 w-full px-4 py-3 text-sm leading-6 text-gray-800 focus:outline-none",
          "[&_p]:min-h-6 [&_p]:whitespace-pre-wrap",
          "[&_.is-editor-empty:first-child::before]:pointer-events-none",
          "[&_.is-editor-empty:first-child::before]:float-left",
          "[&_.is-editor-empty:first-child::before]:h-0",
          "[&_.is-editor-empty:first-child::before]:text-gray-400",
          "[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          "[&_.ProseMirror-selectednode]:ring-2 [&_.ProseMirror-selectednode]:ring-brand-300",
        ),
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const nextValue = contentToParts(currentEditor.getJSON());
      lastValueSignatureRef.current = partsSignature(nextValue);
      onChange(nextValue);
    },
  });

  React.useEffect(() => {
    if (!editor) return;

    const nextSignature = partsSignature(value);
    if (nextSignature === lastValueSignatureRef.current) return;

    editor.commands.setContent(partsToContent(value, variableLabels), { emitUpdate: false });
    lastValueSignatureRef.current = nextSignature;
  }, [editor, value, variableLabels]);

  React.useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className={cn("overflow-hidden rounded-lg border bg-white", error ? "border-error-500" : "border-gray-300")}>
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-3 py-2">
          {variables.map((variable) => (
            <Button
              key={variable.key}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || !editor}
              className="h-8 border-brand-200 px-3 text-xs text-brand-700 hover:border-brand-300 hover:bg-brand-50"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                editor
                  ?.chain()
                  .focus()
                  .insertContent({
                    type: TemplateVariableNode.name,
                    attrs: {
                      key: variable.key,
                      label: variable.label,
                    },
                  })
                  .run();
              }}
            >
              {variable.label}
            </Button>
          ))}
        </div>

        <EditorContent editor={editor} />
      </div>

      {hint ? <p className={cn("text-xs", error ? "text-error-500" : "text-gray-500")}>{hint}</p> : null}
    </div>
  );
}

function partsToContent(parts: TemplateMessagePart[], variableLabels: Map<string, string>): JSONContent {
  const content: JSONContent[] = [];

  parts.forEach((part) => {
    if (part.type === "VARIABLE") {
      content.push({
        type: TemplateVariableNode.name,
        attrs: {
          key: part.key,
          label: variableLabels.get(part.key) ?? part.key,
        },
      });

      return;
    }

    part.text.split("\n").forEach((text, index, lines) => {
      if (text) content.push({ type: "text", text });
      if (index < lines.length - 1) content.push({ type: "hardBreak" });
    });
  });

  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        ...(content.length > 0 ? { content } : {}),
      },
    ],
  };
}

function contentToParts(document: JSONContent): TemplateMessagePart[] {
  const parts: TemplateMessagePart[] = [];
  const blocks = document.content ?? [];

  blocks.forEach((block, index) => {
    appendNodeParts(block, parts);
    if (index < blocks.length - 1) appendTextPart(parts, "\n");
  });

  return parts;
}

function appendNodeParts(node: JSONContent, parts: TemplateMessagePart[]) {
  if (node.type === "text") {
    appendTextPart(parts, node.text ?? "");
    return;
  }

  if (node.type === "hardBreak") {
    appendTextPart(parts, "\n");
    return;
  }

  if (node.type === TemplateVariableNode.name) {
    const key = typeof node.attrs?.key === "string" ? node.attrs.key : "";
    if (key) parts.push({ type: "VARIABLE", key });
    return;
  }

  node.content?.forEach((child) => appendNodeParts(child, parts));
}

function appendTextPart(parts: TemplateMessagePart[], text: string) {
  if (!text) return;

  const previous = parts.at(-1);
  if (previous?.type === "TEXT") {
    previous.text += text;
    return;
  }

  parts.push({ type: "TEXT", text });
}

function partsSignature(parts: TemplateMessagePart[]) {
  return JSON.stringify(parts);
}
