import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "playwright-report/**", "test-results/**"] },
  ...coreWebVitals,
  ...typescript,
  {
    // eslint-config-next 16 added strict React Compiler rules. The existing code predates them and works, so they
    // are reported as warnings instead of failing lint. Clean them up when convenient.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/incompatible-library": "warn",
    },
  },
];

export default config;
