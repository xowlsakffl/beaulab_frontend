"use client";

import React from "react";

const DAUM_POSTCODE_SCRIPT_ID = "daum-postcode-script";
const DAUM_POSTCODE_SCRIPT_SRC = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
const KAKAO_MAP_SCRIPT_ID = "kakao-map-sdk-script";
const KAKAO_MAP_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY ?? "";

function getKakaoMapScriptSrc() {
  if (!KAKAO_MAP_APP_KEY) {
    return "";
  }

  return `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_APP_KEY}&libraries=services&autoload=false`;
}

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

type KakaoAddressSearchResult = {
  x: string;
  y: string;
};

type KakaoGeocoder = {
  addressSearch: (
    addr: string,
    callback: (result: KakaoAddressSearchResult[], status: string) => void,
  ) => void;
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: DaumPostcodeOptions) => DaumPostcodeInstance;
    };
    kakao?: {
      maps?: {
        load: (callback: () => void) => void;
        services?: {
          Geocoder: new () => KakaoGeocoder;
          Status: {
            OK: string;
          };
        };
      };
    };
  }
}

let postcodeScriptPromise: Promise<void> | null = null;
let kakaoMapScriptPromise: Promise<void> | null = null;

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

function initializeKakaoMapServices(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Kakao map is only available in the browser."));
  }

  if (window.kakao?.maps?.services?.Geocoder) {
    return Promise.resolve();
  }

  if (!window.kakao?.maps?.load) {
    return Promise.reject(new Error("Kakao map services are unavailable."));
  }

  return new Promise<void>((resolve, reject) => {
    window.kakao?.maps?.load(() => {
      if (window.kakao?.maps?.services?.Geocoder) {
        resolve();
        return;
      }

      reject(new Error("Kakao map services are unavailable."));
    });
  });
}

function loadKakaoMapScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Kakao map is only available in the browser."));
  }

  if (!KAKAO_MAP_APP_KEY) {
    return Promise.reject(new Error("NEXT_PUBLIC_KAKAO_MAP_APP_KEY is not configured."));
  }

  if (window.kakao?.maps?.services?.Geocoder) {
    return Promise.resolve();
  }

  if (kakaoMapScriptPromise) {
    return kakaoMapScriptPromise;
  }

  kakaoMapScriptPromise = new Promise<void>((resolve, reject) => {
    const initialize = () => {
      void initializeKakaoMapServices().then(resolve).catch(reject);
    };

    const existingScript = document.getElementById(KAKAO_MAP_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      if (window.kakao?.maps?.load) {
        initialize();
        return;
      }

      existingScript.addEventListener("load", initialize, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Kakao map script.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = KAKAO_MAP_SCRIPT_ID;
    script.src = getKakaoMapScriptSrc();
    script.async = true;
    script.onload = initialize;
    script.onerror = () => reject(new Error("Failed to load Kakao map script."));
    document.head.appendChild(script);
  }).catch((error) => {
    kakaoMapScriptPromise = null;
    throw error;
  });

  return kakaoMapScriptPromise;
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

  const geocodeAddress = React.useCallback(async (address: string) => {
    await loadKakaoMapScript();

    if (!window.kakao?.maps?.services?.Geocoder || !window.kakao.maps.services.Status) {
      throw new Error("Kakao geocoder is unavailable.");
    }

    const geocoder = new window.kakao.maps.services.Geocoder();

    return await new Promise<{ latitude: string; longitude: string }>((resolve, reject) => {
      geocoder.addressSearch(address, (result, status) => {
        if (status !== window.kakao?.maps?.services?.Status.OK || !result[0]) {
          reject(new Error("주소 좌표를 찾지 못했습니다."));
          return;
        }

        resolve({
          latitude: result[0].y,
          longitude: result[0].x,
        });
      });
    });
  }, []);

  return {
    isReady,
    error,
    openPostcode,
    geocodeAddress,
  };
}

export type { DaumPostcodeData };
