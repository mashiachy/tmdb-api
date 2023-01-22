import { defineConfig } from "tsup"
import { replace } from "esbuild-plugin-replace"

export default defineConfig({
  name: "tmdb-api-node",
  entry: ["src/**/*.ts", "!src/worker.ts", "src/**/*.gql", "src/**/*.graphql"],
  outDir: "dist/node",
  target: "node14",
  format: "cjs",
  platform: "node",
  bundle: false,
  loader: {
    ".graphql": "text",
    ".gql": "text"
  },
  // @ts-expect-error: esbuild-plugin-replace has conficts with Plugin typings
  esbuildPlugins: [replace({ ".gql": ".js" })]
})
