import { createWebSession } from "@beaulab/api-client";
import { hospitalApi } from "./api";

export const hospitalSession = createWebSession(hospitalApi, "hospital");
