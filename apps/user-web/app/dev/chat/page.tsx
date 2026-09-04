import { notFound } from "next/navigation";
import ChatTestPageClient from "../../ChatTestPageClient";

export default function ChatTestPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <ChatTestPageClient />;
}
