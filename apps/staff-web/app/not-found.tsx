import { GridShape } from "@beaulab/ui-admin";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function NotFound() {
  return (
    <div className="relative z-1 flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      <GridShape />
      <div className="mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]">
        <h1 className="mb-8 text-title-md font-bold text-gray-800 xl:text-title-2xl">ERROR</h1>

        <Image src="/images/error/404.svg" alt="404" width={472} height={152} />

        <p className="mt-10 mb-6 text-base text-gray-700 sm:text-lg">요청하신 페이지를 찾을 수 없습니다.</p>

        <Link
          href="/hospital-dashboard/dashboard"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800"
        >
          홈페이지로 돌아가기
        </Link>
      </div>
      {/* <!-- Footer --> */}
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} - Beaulab
      </p>
    </div>
  );
}
