import { createClient } from "@beaulab/api-client/web";

export const hospitalApi = createClient({
  baseURL: "/api/v1/hospital",
  actor: "hospital",
  onUnauthorized: () => {
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
  },
});
