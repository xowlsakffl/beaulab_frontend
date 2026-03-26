"use client";

import React from "react";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button/Button";

type RichTextEditorUploadResult = {
  url: string;
};

type RichTextEditorProps = {
  id?: string;
  name?: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
  className?: string;
  onChange: (value: string) => void;
  onUploadImage?: (file: File) => Promise<RichTextEditorUploadResult>;
  onUploadError?: (message: string) => void;
};

export function RichTextEditor({
  id,
  name,
  value,
  placeholder = "내용을 입력해 주세요.",
  disabled = false,
  error = false,
  hint,
  className,
  onChange,
  onUploadImage,
  onUploadError,
}: RichTextEditorProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const lastValueRef = React.useRef(value);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Image.configure({
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        id: id ?? "",
        "data-editor-name": name ?? "",
        class: cn(
          "min-h-[280px] w-full px-4 py-3 text-sm leading-6 text-gray-800 focus:outline-none dark:text-white/90",
          "[&_h2]:my-3 [&_h2]:text-lg [&_h2]:font-semibold",
          "[&_h3]:my-3 [&_h3]:text-base [&_h3]:font-semibold",
          "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
          "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6",
          "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6",
          "[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-brand-300 [&_blockquote]:pl-4 [&_blockquote]:text-gray-600 dark:[&_blockquote]:text-gray-300",
          "[&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-xl",
          "[&_.is-editor-empty:first-child::before]:pointer-events-none",
          "[&_.is-editor-empty:first-child::before]:float-left",
          "[&_.is-editor-empty:first-child::before]:h-0",
          "[&_.is-editor-empty:first-child::before]:text-gray-400",
          "[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
        ),
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const nextValue = currentEditor.isEmpty ? "" : currentEditor.getHTML();
      lastValueRef.current = nextValue;
      onChange(nextValue);
      setUploadError(null);
    },
  });

  React.useEffect(() => {
    if (!editor) return;

    const normalizedValue = value || "";
    if (normalizedValue === lastValueRef.current) return;
    if (normalizedValue === editor.getHTML()) {
      lastValueRef.current = normalizedValue;
      return;
    }

    editor.commands.setContent(normalizedValue, { emitUpdate: false });
    lastValueRef.current = normalizedValue;
  }, [editor, value]);

  React.useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  const handleUploadFiles = React.useCallback(
    async (files: FileList | File[] | null) => {
      if (!editor || !onUploadImage || !files || files.length === 0) return;

      const nextFiles = Array.from(files);
      setIsUploading(true);
      setUploadError(null);

      try {
        for (const file of nextFiles) {
          const uploaded = await onUploadImage(file);
          if (!uploaded.url) {
            throw new Error("에디터 이미지 업로드 URL이 비어 있습니다.");
          }

          editor.chain().focus().setImage({ src: uploaded.url, alt: file.name }).run();
        }
      } catch (uploadFailure) {
        const message =
          uploadFailure instanceof Error
            ? uploadFailure.message
            : "에디터 이미지 업로드 중 오류가 발생했습니다.";
        setUploadError(message);
        onUploadError?.(message);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [editor, onUploadError, onUploadImage],
  );

  const toolbarButtonClassName = "h-8 px-2.5 text-xs";

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-xl border bg-white dark:bg-gray-900",
          error ? "border-error-500" : "border-gray-300 dark:border-gray-700",
        )}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-800">
          <ToolbarButton
            active={Boolean(editor?.isActive("heading", { level: 2 }))}
            disabled={disabled || !editor}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={toolbarButtonClassName}
          >
            <Heading2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={Boolean(editor?.isActive("heading", { level: 3 }))}
            disabled={disabled || !editor}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            className={toolbarButtonClassName}
          >
            <Heading3 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={Boolean(editor?.isActive("bold"))}
            disabled={disabled || !editor}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={toolbarButtonClassName}
          >
            <Bold className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={Boolean(editor?.isActive("italic"))}
            disabled={disabled || !editor}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={toolbarButtonClassName}
          >
            <Italic className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={Boolean(editor?.isActive("strike"))}
            disabled={disabled || !editor}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            className={toolbarButtonClassName}
          >
            <Strikethrough className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={Boolean(editor?.isActive("bulletList"))}
            disabled={disabled || !editor}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={toolbarButtonClassName}
          >
            <List className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={Boolean(editor?.isActive("orderedList"))}
            disabled={disabled || !editor}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={toolbarButtonClassName}
          >
            <ListOrdered className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={Boolean(editor?.isActive("blockquote"))}
            disabled={disabled || !editor}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={toolbarButtonClassName}
          >
            <Quote className="size-4" />
          </ToolbarButton>

          {onUploadImage ? (
            <>
              <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-800" />
              <ToolbarButton
                active={false}
                disabled={disabled || isUploading}
                onClick={() => fileInputRef.current?.click()}
                className={toolbarButtonClassName}
              >
                <ImagePlus className="size-4" />
              </ToolbarButton>
            </>
          ) : null}

          <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-800" />

          <ToolbarButton
            active={false}
            disabled={disabled || !editor?.can().undo()}
            onClick={() => editor?.chain().focus().undo().run()}
            className={toolbarButtonClassName}
          >
            <Undo2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={false}
            disabled={disabled || !editor?.can().redo()}
            onClick={() => editor?.chain().focus().redo().run()}
            className={toolbarButtonClassName}
          >
            <Redo2 className="size-4" />
          </ToolbarButton>

          {isUploading ? (
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">이미지 업로드 중...</span>
          ) : null}
        </div>

        <EditorContent editor={editor} />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            void handleUploadFiles(event.target.files);
          }}
        />
      </div>

      {uploadError ? <p className="text-xs text-error-500">{uploadError}</p> : null}
      {hint ? <p className={cn("text-xs", error ? "text-error-500" : "text-gray-500 dark:text-gray-400")}>{hint}</p> : null}
    </div>
  );
}

function ToolbarButton({
  active,
  className,
  ...props
}: React.ComponentProps<typeof Button> & {
  active: boolean;
}) {
  return (
    <Button
      type="button"
      variant={active ? "brand" : "outline"}
      size="sm"
      className={cn(active ? "border-brand-500" : "border-gray-200 dark:border-gray-800", className)}
      {...props}
    />
  );
}

export default RichTextEditor;
