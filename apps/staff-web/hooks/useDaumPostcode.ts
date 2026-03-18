"use client";

import React from "react";

const DAUM_POSTCODE_SCRIPT_ID = "daum-postcode-script";
const DAUM_POSTCODE_SCRIPT_SRC = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

type DaumPostcodeData = {
  address: string;
  addressType: "R" | "J";
  apartment: "Y" | "N";
  bname: string;
  buildingName: string;
  jibunAddress: string;
  roadAddress: string;
  userSelectedType: "R" | "J";
  zonecode: string;
};

type DaumPostcodeInstance = {
  open: () => void;
};

type DaumPostcodeOptions = {
  oncomplete: (data: DaumPostcodeData) => void;
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: DaumPostcodeOptions) => DaumPostcodeInstance;
    };
  }
}

let postcodeScriptPromise: Promise<void> | null = null;

function loadDaumPostcodeScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Daum postcode is only available in the browser."));
  }

  if (window.daum?.Postcode) {
    return Promise.resolve();
  }

  if (postcodeScriptPromise) {
    return postcodeScriptPromise;
  }

  postcodeScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(DAUM_POSTCODE_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Daum postcode script.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = DAUM_POSTCODE_SCRIPT_ID;
    script.src = DAUM_POSTCODE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Daum postcode script."));
    document.head.appendChild(script);
  }).catch((error) => {
    postcodeScriptPromise = null;
    throw error;
  });

  return postcodeScriptPromise;
}

export function formatDaumAddress(data: DaumPostcodeData) {
  const primaryAddress = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;

  if (data.userSelectedType !== "R") {
    return primaryAddress;
  }

  const extras: string[] = [];

  if (data.bname) {
    extras.push(data.bname);
  }

  if (data.buildingName && data.apartment === "Y") {
    extras.push(data.buildingName);
  }

  if (extras.length === 0) {
    return primaryAddress;
  }

  return `${primaryAddress} (${extras.join(", ")})`;
}

export function useDaumPostcode() {
  const [isReady, setIsReady] = React.useState<boolean>(typeof window !== "undefined" && Boolean(window.daum?.Postcode));
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    void loadDaumPostcodeScript()
      .then(() => {
        if (!cancelled) {
          setIsReady(true);
          setError(null);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "주소 검색 스크립트를 불러오지 못했습니다.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const openPostcode = React.useCallback(async (onComplete: (data: DaumPostcodeData) => void) => {
    try {
      await loadDaumPostcodeScript();

      if (!window.daum?.Postcode) {
        throw new Error("Daum postcode service is unavailable.");
      }

      setIsReady(true);
      setError(null);
      new window.daum.Postcode({
        oncomplete: onComplete,
      }).open();
    } catch (openError) {
      const nextError = openError instanceof Error ? openError.message : "주소 검색을 열지 못했습니다.";
      setError(nextError);
      throw openError;
    }
  }, []);

  return {
    isReady,
    error,
    openPostcode,
  };
}

export type { DaumPostcodeData };
