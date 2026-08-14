"use client";

import { AddCircleButton } from "@/components/common/AddCircleButton";
import { MAX_DOCTOR_TEXT_ITEM_COUNT, type DoctorFieldName } from "@/lib/doctor/form";
import { Card, CircleRemoveButton, InputField } from "@beaulab/ui-admin";

const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const formControlClassName = "h-11 bg-white px-4 py-2.5";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function RepeaterPanel({
  title,
  field,
  values,
  error,
  onChange,
}: {
  title: string;
  field: DoctorFieldName;
  values: string[];
  error?: string;
  onChange: (values: string[]) => void;
}) {
  const displayValues = values.length > 0 ? values : [""];
  const canAddItem = displayValues.length < MAX_DOCTOR_TEXT_ITEM_COUNT;

  const updateValue = (index: number, value: string) => {
    const nextValues = [...displayValues];
    nextValues[index] = value;
    onChange(nextValues);
  };

  const removeValue = (index: number) => {
    if (displayValues.length <= 1) return;
    onChange(displayValues.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <Card className={cx(cardClassName, "h-full")} data-field-target={field} tabIndex={-1}>
      <div className="flex h-full min-h-48 flex-col">
        <h3 className="mb-4 text-sm font-bold text-gray-900">{title}</h3>
        <div className="flex-1 space-y-2">
          {displayValues.map((value, index) => (
            <div key={`${field}-${index}`} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <InputField
                  value={value}
                  onChange={(event) => updateValue(index, event.target.value)}
                  placeholder={`${title}을 입력해 주세요.`}
                  className={formControlClassName}
                />
              </div>
              {index > 0 ? (
                <CircleRemoveButton
                  onClick={() => removeValue(index)}
                  className="size-7"
                  aria-label={`${title} 삭제`}
                />
              ) : (
                <span className="size-7 shrink-0" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-auto flex flex-col items-center pt-3">
          <AddCircleButton
            label={`${title} 추가`}
            onClick={() => {
              if (!canAddItem) return;
              onChange([...displayValues, ""]);
            }}
            disabled={!canAddItem}
            className="disabled:cursor-not-allowed disabled:opacity-40"
          />
          {!canAddItem ? (
            <p className="mt-2 text-center text-xs text-gray-500">
              최대 {MAX_DOCTOR_TEXT_ITEM_COUNT}개까지 입력할 수 있습니다.
            </p>
          ) : null}
          {error ? <p className="mt-2 text-xs text-error-500">{error}</p> : null}
        </div>
      </div>
    </Card>
  );
}
