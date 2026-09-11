import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "../../icons";

type AuthFormPanelProps = {
  children?: ReactNode;
  title?: string;
  description?: ReactNode;
  loginHref?: string | null;
};

export function AuthFormPanel({ children, title, description, loginHref }: AuthFormPanelProps) {
  return (
    <div className="flex w-full min-w-0 flex-1 flex-col">
      <div className="mx-auto my-auto w-full max-w-md">
        {loginHref ? (
          <Link
            href={loginHref}
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-brand-500"
          >
            <ArrowLeft className="size-4" />
            로그인으로 돌아가기
          </Link>
        ) : null}
        {title || description ? (
          <div className="mb-5 sm:mb-8">
            {title ? (
              <h1 className="mb-2 text-title-sm font-semibold break-words text-gray-800 sm:text-title-md">{title}</h1>
            ) : null}
            {description ? <p className="text-sm leading-6 break-words text-gray-500">{description}</p> : null}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
