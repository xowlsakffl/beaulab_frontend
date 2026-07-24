import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import React from "react";

import { GridShape } from "../common";

type ErrorStatusContent = {
  title: string;
  description: ReactNode;
};

export const ERROR_STATUS_CONTENT = {
  "404": {
    title: "페이지를 찾을 수 없습니다.",
    description: "요청하신 페이지가 없거나 접근할 수 없는 주소입니다.",
  },
  "419": {
    title: "요청 시간이 만료되었습니다.",
    description: (
      <>
        보안을 위해 유효 시간이 지난 요청은 처리할 수 없습니다.
        <br />
        이전 단계에서 다시 요청해 주세요.
      </>
    ),
  },
  "429": {
    title: "요청이 일시적으로 제한되었습니다.",
    description: (
      <>
        짧은 시간에 여러 번 요청되어 처리가 제한되었습니다.
        <br />
        잠시 후 다시 시도해 주세요.
      </>
    ),
  },
} satisfies Record<string, ErrorStatusContent>;

export type ErrorStatusCode = keyof typeof ERROR_STATUS_CONTENT;

const ERROR_STATUS_METADATA_TITLES = {
  "404": "페이지 없음 | 뷰랩 관리자",
  "419": "요청 만료 | 뷰랩 관리자",
  "429": "요청 제한 | 뷰랩 관리자",
} satisfies Record<ErrorStatusCode, string>;

type ErrorStatusRouteProps = {
  params: Promise<{
    code: string;
  }>;
};

type ErrorStatusPageProps = {
  code: ErrorStatusCode;
};

export function ErrorStatusPage({ code }: ErrorStatusPageProps) {
  const content = ERROR_STATUS_CONTENT[code];

  return (
    <div className="relative z-1 flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 py-12">
      <GridShape />

      <main className="relative z-10 mx-auto flex w-full max-w-[560px] flex-col items-center text-center">
        <div className="relative mb-8">
          <div className="absolute inset-x-6 top-1/2 h-10 -translate-y-1/2 rounded-full bg-brand-50" />
          <div className="relative text-[112px] leading-none font-semibold tracking-normal text-brand-500 sm:text-[148px]">
            {code}
          </div>
        </div>

        <h1 className="text-title-sm font-semibold text-gray-900 sm:text-title-md">{content.title}</h1>

        <div className="mt-4 text-sm leading-6 text-gray-500 sm:text-base">{content.description}</div>
      </main>

      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} - Beaulab
      </p>
    </div>
  );
}

export function NotFoundPage() {
  return <ErrorStatusPage code="404" />;
}

export async function generateErrorStatusMetadata({ params }: ErrorStatusRouteProps): Promise<Metadata> {
  const { code } = await params;

  if (!isErrorStatusCode(code)) {
    return {
      title: ERROR_STATUS_METADATA_TITLES["404"],
    };
  }

  return {
    title: ERROR_STATUS_METADATA_TITLES[code],
  };
}

export async function ErrorStatusRoutePage({ params }: ErrorStatusRouteProps) {
  const { code } = await params;

  if (!isErrorStatusCode(code)) {
    notFound();
  }

  return <ErrorStatusPage code={code} />;
}

function isErrorStatusCode(code: string): code is ErrorStatusCode {
  return Object.prototype.hasOwnProperty.call(ERROR_STATUS_CONTENT, code);
}
