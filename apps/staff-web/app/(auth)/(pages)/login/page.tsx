import LoginPageClient from "./LoginPageClient";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function SignInPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const nextPath = typeof resolvedSearchParams.next === "string" ? resolvedSearchParams.next : "/";

  return <LoginPageClient nextPath={nextPath} />;
}
