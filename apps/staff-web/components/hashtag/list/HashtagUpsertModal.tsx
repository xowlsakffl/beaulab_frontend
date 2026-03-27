"use client";

import React from "react";

import {
  Button,
  InputField,
  Label,
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  Select,
} from "@beaulab/ui-admin";

import {
  HASHTAG_STATUS_OPTIONS,
  normalizeHashtagName,
  sanitizeHashtagName,
  validateHashtagName,
} from "@/lib/hashtag/list";

type HashtagUpsertModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  initialName: string;
  initialStatus: string;
  submitting: boolean;
  submitError: string | null;
  onClose: () => void;
  onSubmit: (name: string, status: string) => void;
};

export function HashtagUpsertModal({
  isOpen,
  mode,
  initialName,
  initialStatus,
  submitting,
  submitError,
  onClose,
  onSubmit,
}: HashtagUpsertModalProps) {
  const [nameInput, setNameInput] = React.useState(initialName);
  const [statusInput, setStatusInput] = React.useState(initialStatus);
  const [localError, setLocalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    setNameInput(initialName);
    setStatusInput(initialStatus);
    setLocalError(null);
  }, [initialName, initialStatus, isOpen]);

  const sanitizedName = React.useMemo(() => sanitizeHashtagName(nameInput), [nameInput]);
  const normalizedPreview = React.useMemo(() => normalizeHashtagName(nameInput), [nameInput]);
  const displayError = localError ?? submitError;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateHashtagName(nameInput);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError(null);
    onSubmit(sanitizedName, statusInput || "ACTIVE");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? () => undefined : onClose}
      className="mx-4 w-full max-w-xl"
    >
      <ModalPanel>
        <ModalHeader>
          <ModalTitle>
            {mode === "create" ? "해시태그 등록" : "해시태그 수정"}
          </ModalTitle>
          <ModalDescription>
            저장 시 고유 검색 키는 자동으로 정리됩니다.
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div>
              <Label htmlFor="hashtag-name">해시태그명</Label>
              <InputField
                id="hashtag-name"
                value={nameInput}
                onChange={(event) => {
                  setNameInput(event.target.value);
                  setLocalError(null);
                }}
                placeholder="예: 강남성형외과"
                error={Boolean(displayError)}
                hint={displayError ?? undefined}
                className="bg-white dark:bg-gray-800"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                허용 문자: 영문, 숫자, 한글, 밑줄(_) / 최대 20자
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">고유 검색 키</span>
                <code className="inline-flex min-h-7 items-center rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  {normalizedPreview || "-"}
                </code>
              </div>
            </div>

            <div>
              <Label htmlFor="hashtag-status">운영상태</Label>
              <Select
                id="hashtag-status"
                value={statusInput || "ACTIVE"}
                options={HASHTAG_STATUS_OPTIONS}
                showPlaceholderOption={false}
                onChange={setStatusInput}
                className="h-11 w-full px-4"
              />
            </div>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              취소
            </Button>
            <Button type="submit" variant="brand" disabled={submitting}>
              {submitting
                ? mode === "create" ? "등록 중..." : "수정 중..."
                : mode === "create" ? "등록" : "수정 저장"}
            </Button>
          </ModalFooter>
        </form>
      </ModalPanel>
    </Modal>
  );
}
