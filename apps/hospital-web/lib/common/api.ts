import { createClient } from "@beaulab/api-client";

const apiOrigin = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8000";

export const hospitalApi = createClient({
  baseURL: `${apiOrigin.replace(/\/$/, "")}/api/v1/hospital`,
  actor: "hospital",
});
