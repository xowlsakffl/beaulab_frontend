import { ErrorStatusPage } from "@/components/common/ErrorStatusPage";
import React from "react";

export const metadata = {
  title: "요청 제한 | 뷰랩 관리자",
};

export default function RateLimitedPage() {
  return (
    <ErrorStatusPage
      code="429"
      title="요청이 일시적으로 제한되었습니다."
      description={
        <>
          짧은 시간에 여러 번 요청되어 처리가 제한되었습니다.
          <br />
          잠시 후 다시 시도해 주세요.
        </>
      }
    />
  );
}
