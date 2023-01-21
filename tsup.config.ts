import { defineConfig, type Options } from "tsup"
import { replace } from "esbuild-plugin-replace"

const options: Options = {
  target: "node14",
  format: "esm",
  legacyOutput: true,
  clean: true,
  skipNodeModulesBundle: true,
  treeshake: true,
  platform: "node",
  bundle: false,
  loader: {
    ".graphql": "text",
    ".gql": "text"
  }
}

export default defineConfig([
  {
    name: "tmdb-api-node",
    entry: [
      "src/**/*.ts",
      "!src/worker.ts",
      "src/**/*.gql",
      "src/**/*.graphql"
    ],
    outDir: "dist/node",
    ...options
  },
  {
    name: "tmdb-api-worker",
    entry: ["src/**/*.ts", "!src/index.ts", "src/**/*.gql", "src/**/*.graphql"],
    outDir: "dist/worker",
    bundle: true,
    minify: true,
    // @ts-ignore
    esbuildPlugins: [replace({ "process.env.": "globalThis.", ".gql": ".js" })],
    ...options
  }
])
