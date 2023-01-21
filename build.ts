import { build } from "esbuild"
import esbuildGraphqlLoader from "@luckycatfactory/esbuild-graphql-loader"
import { replace } from "esbuild-plugin-replace"

const promises = [
  build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    outfile: "dist/index.js",
    platform: "node",
    target: "node14",
    format: "cjs",
    minify: false,
    plugins: [esbuildGraphqlLoader()]
  }).catch((error) => {
    throw new Error("Node environment build error", { cause: error })
  }),
  build({
    entryPoints: ["src/worker.ts"],
    bundle: true,
    outfile: "dist/worker.js",
    platform: "node",
    target: "esnext",
    format: "esm",
    plugins: [
      esbuildGraphqlLoader(),
      replace({
        "process.env.": ""
      })
    ]
  }).catch((error) => {
    throw new Error("CF environment build error", { cause: error })
  })
]

Promise.all(promises)
  .then(() => {
    console.log("All builds complete")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Build error:", error)
    process.exit(1)
  })
