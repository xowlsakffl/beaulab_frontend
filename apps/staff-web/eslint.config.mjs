import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import base from "../../eslint.base.mjs";

export default defineConfig([...nextVitals, ...base]);
