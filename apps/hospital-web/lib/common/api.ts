import { createClient } from "@beaulab/api-client";

export const hospitalApi = createClient({
  baseURL: "/api/v1/hospital",
  actor: "hospital",
});
