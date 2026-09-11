import { createWebSession } from "@beaulab/api-client/web";
import { hospitalApi } from "./api";

export const hospitalSession = createWebSession(hospitalApi, "hospital");
