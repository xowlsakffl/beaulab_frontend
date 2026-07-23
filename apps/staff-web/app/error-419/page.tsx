import { ErrorStatusPage } from "@/components/common/ErrorStatusPage";
import React from "react";

export const metadata = {
  title: "요청 만료 | 뷰랩 관리자",
};

export default function ExpiredRequestPage() {
  return (
    <ErrorStatusPage
      code="419"
      title="요청 시간이 만료되었습니다."
      description={
        <>
          보안을 위해 유효 시간이 지난 요청은 처리할 수 없습니다.
          <br />
          이전 단계에서 다시 요청해 주세요.
        </>
      }
    />
  );
}
