import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

const root = path.dirname(fileURLToPath(import.meta.url));
const appNames = fs
  .readdirSync(path.join(root, "apps"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(root, "apps", entry.name, "package.json")))
  .map((entry) => JSON.parse(fs.readFileSync(path.join(root, "apps", entry.name, "package.json"), "utf8")).name);

const workspaceBoundaries = {
  meta: {
    type: "problem",
    schema: [],
    messages: { boundary: "Use the owning workspace's public exports; do not import another app or package source." },
  },
  create(context) {
    const filename = context.filename;
    const owner = path.relative(root, filename).split(path.sep).slice(0, 2).join("/");
    function check(node) {
      const source = node.source;
      if (!source || typeof source.value !== "string") return;
      const name = source.value;
      let invalid = name.startsWith("@beaulab/") && /\/src(?:\/|$)/.test(name);
      if (appNames.some((app) => name === app || name.startsWith(`${app}/`))) invalid = true;
      if (owner.startsWith("packages/") && name.startsWith("@/")) invalid = true;
      if (name.startsWith(".")) {
        const target = path.relative(root, path.resolve(path.dirname(filename), name)).split(path.sep);
        const targetOwner = target.slice(0, 2).join("/");
        if (["apps", "packages"].includes(target[0]) && targetOwner !== owner) invalid = true;
      }
      if (invalid) context.report({ node: source, messageId: "boundary" });
    }
    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
    };
  },
};

export default [
  { ignores: ["**/.next/**", "**/out/**", "**/build/**", "**/next-env.d.ts"] },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    plugins: { react, "react-hooks": reactHooks, workspace: { rules: { boundaries: workspaceBoundaries } } },
    settings: { react: { version: "19.2" } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "workspace/boundaries": "error",
    },
  },
];
