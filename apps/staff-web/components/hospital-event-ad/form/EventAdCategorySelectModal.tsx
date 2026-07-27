"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  SpinnerBlock,
} from "@beaulab/ui-admin";

import type { EventAdCategoryOption, EventAdPlacementOption } from "@/lib/hospital-event-ad/form";

export function EventAdCategorySelectModal({
  placement,
  categories,
  selectedCategoryId,
  isLoading,
  error,
  onSelectCategory,
  onClose,
  onConfirm,
}: {
  placement: EventAdPlacementOption | null;
  categories: EventAdCategoryOption[];
  selectedCategoryId: number | null;
  isLoading: boolean;
  error: string | null;
  onSelectCategory: (categoryId: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal isOpen={Boolean(placement)} onClose={onClose} showCloseButton={false} className="mx-4 w-full max-w-2xl">
      <ModalPanel>
        <ModalHeader className="pr-0">
          <ModalTitle>카테고리 선택</ModalTitle>
        </ModalHeader>
        <ModalBody className="mt-5">
          <div className="space-y-5">
            <p className="text-sm font-medium text-gray-800">상단 배너 광고를 게재할 카테고리를 선택해 주세요.</p>
            {isLoading ? (
              <SpinnerBlock className="min-h-24" spinnerClassName="size-7" label="카테고리 불러오는 중" />
            ) : error ? (
              <p className="text-sm text-error-500">{error}</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-gray-500">선택 가능한 카테고리가 없습니다.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => {
                  const selected = selectedCategoryId === category.id;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => onSelectCategory(category.id)}
                      className={[
                        "h-9 min-w-18 rounded-md border px-4 text-sm font-semibold transition",
                        selected
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:border-brand-400 hover:text-brand-500",
                      ].join(" ")}
                    >
                      {category.display_name || category.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            type="button"
            variant="brand"
            onClick={onConfirm}
            disabled={isLoading || Boolean(error) || !selectedCategoryId}
          >
            확인
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}
