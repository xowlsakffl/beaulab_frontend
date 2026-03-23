import { createClient } from "@beaulab/api-client";

export const api = createClient({
    baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/staff`,
    actor: "staff",
});
