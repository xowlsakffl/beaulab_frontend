"use client";

import { Card, InputField, RichTextEditor } from "@beaulab/ui-admin";
import { NoticeFormField } from "./NoticeFormField";
import type { NoticeFormErrors, NoticeFormValues } from "@/lib/notice/form";

type NoticeMainSectionProps = {
  form: NoticeFormValues;
  errors: NoticeFormErrors;
  onFieldChange: <K extends keyof NoticeFormValues>(key: K, value: NoticeFormValues[K]) => void;
  onContentChange: (value: string) => void;
  onUploadEditorImage: (file: File) => Promise<{ url: string }>;
};

export function NoticeMainSection({
  form,
  errors,
  onFieldChange,
  onContentChange,
  onUploadEditorImage,
}: NoticeMainSectionProps) {
  return (
    <Card as="section" className="min-w-0 space-y-5 rounded-xl p-5">
      <NoticeFormField label="제목" htmlFor="title" required error={errors.title}>
        <InputField
          id="title"
          name="title"
          value={form.title}
          maxLength={255}
          onChange={(event) => onFieldChange("title", event.target.value)}
          placeholder="제목을 입력해 주세요."
          error={Boolean(errors.title)}
        />
      </NoticeFormField>
      <NoticeFormField label="내용" htmlFor="notice-content" target="content" required error={errors.content}>
        <RichTextEditor
          id="notice-content"
          name="content"
          value={form.content}
          onChange={onContentChange}
          onUploadImage={onUploadEditorImage}
          placeholder="내용을 입력해 주세요."
          error={Boolean(errors.content)}
        />
      </NoticeFormField>
    </Card>
  );
}
