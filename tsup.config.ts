import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "auth/index": "src/auth/index.ts",
    "utils/index": "src/utils/index.ts",
    "ui/index": "src/ui/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  external: ["react", "react-dom", /^@radix-ui\//, "lucide-react", "class-variance-authority"],
  treeshake: true,
});
