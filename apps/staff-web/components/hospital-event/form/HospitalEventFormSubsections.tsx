"use client";

import React from "react";
import { Button, CircleRemoveButton, FormCheckbox, InputField, Label } from "@beaulab/ui-admin";

import { AddCircleButton } from "@/components/common/AddCircleButton";
import {
  formatNumberInput,
  parseNumberInput,
  type HospitalEventFormValues,
  type HospitalEventOptionForm,
} from "@/lib/hospital-event/form";

const labelClassName = "text-xs font-semibold text-gray-500";
const inputClassName = "h-11 bg-white px-4 text-sm";

export function EventOptionsSection({
  enabled,
  options,
  error,
  onEnabledChange,
  onOptionChange,
  onAddOption,
  onRemoveOption,
}: {
  enabled: boolean;
  options: HospitalEventOptionForm[];
  error?: string;
  onEnabledChange: (checked: boolean) => void;
  onOptionChange: (index: number, patch: Partial<HospitalEventOptionForm>) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
}) {
  return (
    <div className="space-y-2" data-field-target="options" tabIndex={-1}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <FormCheckbox
            checked={enabled}
            onChange={onEnabledChange}
            label="이벤트 옵션 선택"
            className="size-4 rounded-full"
          />
          <span className="min-w-0 truncate text-xs text-gray-500">
            성형 카테고리 선택시 이벤트 옵션을 선택하실 수 없습니다.
          </span>
        </div>
        <Button type="button" variant="outline" size="sm" className="h-7 px-3 text-xs">
          옵션가이드
        </Button>
      </div>
      {enabled ? (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-2 py-2">옵션명</th>
                  <th className="w-16 px-1 py-2 text-center">회차</th>
                  <th className="w-20 px-1 py-2">정가</th>
                  <th className="w-28 px-1 py-2">할인가</th>
                  <th className="w-10 px-1 py-2 text-center">삭제</th>
                </tr>
              </thead>
              <tbody>
                {options.map((option, index) => {
                  const normalPrice = parseNumberInput(option.normal_price);
                  const eventPrice = parseNumberInput(option.event_price);
                  const discountRate =
                    normalPrice > 0 && eventPrice > 0
                      ? Math.max(0, Math.floor((1 - eventPrice / normalPrice) * 100))
                      : 0;

                  return (
                    <tr key={index} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-1.5 py-1.5">
                        <EventOptionTableInput
                          value={option.name}
                          onChange={(event) => onOptionChange(index, { name: event.target.value.slice(0, 40) })}
                          placeholder={
                            index === 0 ? "이벤트명과 연관된 시술을 입력해 주세요." : "40자 이내로 입력하세요."
                          }
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <div className="flex items-center justify-center gap-1 text-[11px] text-gray-700">
                          <button
                            type="button"
                            className="px-1 text-gray-500"
                            onClick={() => {
                              const nextCount = Math.max(1, (Number.parseInt(option.session_count, 10) || 1) - 1);
                              onOptionChange(index, { session_count: String(nextCount) });
                            }}
                          >
                            -
                          </button>
                          <span className="min-w-3 text-center font-medium">{option.session_count || "1"}</span>
                          <button
                            type="button"
                            className="px-1 text-gray-500"
                            onClick={() => {
                              const nextCount = (Number.parseInt(option.session_count, 10) || 1) + 1;
                              onOptionChange(index, { session_count: String(nextCount) });
                            }}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-1 py-1.5">
                        <EventOptionTableInput
                          value={option.normal_price}
                          onChange={(event) =>
                            onOptionChange(index, { normal_price: formatNumberInput(event.target.value) })
                          }
                          placeholder="정가 입력"
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <div className="grid grid-cols-[minmax(0,1fr)_2.25rem] items-center gap-1">
                          <EventOptionTableInput
                            value={option.event_price}
                            onChange={(event) =>
                              onOptionChange(index, { event_price: formatNumberInput(event.target.value) })
                            }
                            placeholder="할인가 입력"
                          />
                          <span className="text-right text-[11px] font-medium text-brand-500">{discountRate}%</span>
                        </div>
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <CircleRemoveButton onClick={() => onRemoveOption(index)} className="mx-auto size-6" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Button type="button" variant="outline" size="sm" className="h-8 w-full" onClick={onAddOption}>
            + 옵션추가
          </Button>
        </>
      ) : null}
      {error ? <p className="mt-2 text-xs text-error-500">{error}</p> : null}
    </div>
  );
}

export function TextItemSection({
  title,
  items,
  maxItems,
  error,
  onAdd,
  onRemove,
  onChange,
}: {
  title: string;
  items: string[];
  maxItems: number;
  error?: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, value: string) => void;
}) {
  const displayItems = items.length > 0 ? items : [""];
  const canAddItem = displayItems.length < maxItems;

  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-3">
      <Label className={`${labelClassName} pt-2`}>
        <span className="block">{title}</span>
        <span className="mt-1 block text-[11px] font-normal text-gray-400">(최대 {maxItems}개)</span>
      </Label>
      <div className="min-w-0 space-y-2">
        {displayItems.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <InputField
                value={item}
                onChange={(event) => onChange(index, event.target.value)}
                placeholder="90자 이내로 입력해 주세요."
                className={inputClassName}
              />
            </div>
            {index > 0 ? (
              <CircleRemoveButton onClick={() => onRemove(index)} className="size-7" aria-label={`${title} 삭제`} />
            ) : (
              <span className="size-7 shrink-0" aria-hidden="true" />
            )}
          </div>
        ))}
        <div className="flex justify-center">
          <AddCircleButton
            label={`${title} 추가`}
            onClick={() => {
              if (!canAddItem) return;
              onAdd();
            }}
            disabled={!canAddItem}
            className="disabled:cursor-not-allowed disabled:opacity-40"
          />
        </div>
        {error ? <p className="text-xs text-error-500">{error}</p> : null}
      </div>
    </div>
  );
}

export function DoctorVisibilitySection({
  assignments,
  onChange,
}: {
  assignments: HospitalEventFormValues["doctor_assignments"];
  onChange: (index: number, patch: Partial<HospitalEventFormValues["doctor_assignments"][number]>) => void;
}) {
  const selectedAssignments = assignments.filter((assignment) => assignment.hospital_doctor_id);

  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-3">
      <Label className={`${labelClassName} pt-2`}>
        <span className="block">의료진</span>
        <span className="block">정보노출선택</span>
      </Label>
      <div className="min-w-0 space-y-2">
        {assignments.map((assignment, index) => {
          if (!assignment.hospital_doctor_id) return null;

          return (
            <div
              key={assignment.hospital_doctor_id}
              className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
            >
              <InputField value={assignment.name} readOnly className={inputClassName} />
              <FormCheckbox
                checked={assignment.is_career_visible}
                onChange={(checked) => onChange(index, { is_career_visible: checked })}
                label="경력사항 노출"
              />
              <FormCheckbox
                checked={assignment.is_activity_visible}
                onChange={(checked) => onChange(index, { is_activity_visible: checked })}
                label="활동사항 노출"
              />
            </div>
          );
        })}
        {selectedAssignments.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
            의료진 선택에서 의료진을 선택하면 노출 항목을 설정할 수 있습니다.
          </div>
        ) : null}
        <p className="text-xs text-gray-500">* 노출여부 체크시 원장님 경력 / 활동 사항은 자동 입력 됩니다.</p>
      </div>
    </div>
  );
}

function EventOptionTableInput(props: React.ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={[
        "h-7 w-full min-w-0 rounded-md border border-transparent bg-transparent px-1 text-[11px] text-gray-700 transition outline-none placeholder:text-gray-400 focus:border-brand-200 focus:bg-white focus:ring-2 focus:ring-brand-100",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
