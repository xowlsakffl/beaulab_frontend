import { createClient, createWebSession } from "@beaulab/api-client/web";

export const userApi = createClient({ baseURL: "/api/v1/user", actor: "user" });
export const userSession = createWebSession(userApi, "user");
