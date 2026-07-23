import { ErrorStatusPage } from "@/components/common/ErrorStatusPage";
import React from "react";

export default function NotFound() {
  return (
    <ErrorStatusPage
      code="404"
      title="페이지를 찾을 수 없습니다."
      description="요청하신 페이지가 없거나 접근할 수 없는 주소입니다."
    />
  );
}
