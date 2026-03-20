"use client";

import React from "react";

import { formatDaumAddress } from "@/hooks/useDaumPostcode";
import type {
  HospitalAddressDetailField,
  HospitalAddressField,
  HospitalFieldName,
  HospitalFormErrors,
  HospitalFormValues,
} from "@/lib/hospital/form";

type AddressSearchAlert = {
  variant: "error";
  title: string;
  message: string;
};

export function useHospitalAddressSearch({
  openPostcode,
  geocodeAddress,
  clearError,
  setErrors,
  setForm,
  showAlert,
  focusField,
}: {
  openPostcode: (onComplete: (data: Parameters<typeof formatDaumAddress>[0]) => void) => Promise<void>;
  geocodeAddress: (address: string) => Promise<{ latitude: string; longitude: string }>;
  clearError: (field: HospitalFieldName) => void;
  setErrors: React.Dispatch<React.SetStateAction<HospitalFormErrors>>;
  setForm: React.Dispatch<React.SetStateAction<HospitalFormValues>>;
  showAlert: (alert: AddressSearchAlert) => void;
  focusField: (field: HospitalFieldName) => void;
}) {
  const guideHospitalAddressSelection = React.useCallback(() => {
    setErrors((prev) => ({
      ...prev,
      address: prev.address ?? "병의원 주소를 먼저 선택하세요.",
    }));

    window.setTimeout(() => {
      focusField("address");
    }, 0);
  }, [focusField, setErrors]);

  const openAddressSearch = React.useCallback(
    async (field: HospitalAddressField, detailFieldId: HospitalAddressDetailField) => {
      try {
        await openPostcode((data) => {
          void (async () => {
            const nextAddress = formatDaumAddress(data);
            let coordinates: { latitude: string; longitude: string } | null = null;

            if (field === "address") {
              try {
                coordinates = await geocodeAddress(nextAddress);
              } catch {
                setErrors((prev) => ({
                  ...prev,
                  address: "주소 좌표를 확인하지 못했습니다. 주소를 다시 선택해주세요.",
                }));
              }
            }

            setForm((prev) => ({
              ...prev,
              [field]: nextAddress,
              latitude: field === "address" ? coordinates?.latitude ?? "" : prev.latitude,
              longitude: field === "address" ? coordinates?.longitude ?? "" : prev.longitude,
            }));

            if (field !== "address" || coordinates) {
              clearError(field);
            }

            window.setTimeout(() => {
              const detailInput = document.getElementById(detailFieldId);
              if (detailInput instanceof HTMLInputElement) {
                detailInput.focus();
              }
            }, 0);
          })();
        });
      } catch {
        showAlert({
          variant: "error",
          title: "주소 검색 실패",
          message: "주소 검색을 열지 못했습니다. 잠시 후 다시 시도해주세요.",
        });
      }
    },
    [clearError, geocodeAddress, openPostcode, setErrors, setForm, showAlert],
  );

  return {
    guideHospitalAddressSelection,
    openAddressSearch,
  };
}
