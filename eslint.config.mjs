import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated Prisma client — not our source.
    "src/generated/**",
    // Separately toolchained workspaces (own configs).
    "mobile/**",
    "packages/**",
  ]),
  {
    // Pre-existing stylistic debt — surfaced as warnings so CI stays green on
    // errors while these get burned down. `any` is also pragmatic at the
    // boundaries of untyped third-party globals (gtag, fbq) and SDK event types.
    rules: {
      "react/no-unescaped-entities": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      // Intentional state resets on source change (e.g. the video player) trip
      // this new heuristic; keep it visible as a warning rather than a hard error.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
