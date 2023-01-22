<h1 align="center" style="display: block; text-align: center;">🎬 TMDB API (Made with Apollo Server v4; With cloudflare worker integration)</h1>
<p align="center">A GraphQL API wrapper for The Movie DB built with <a href="https://www.apollographql.com/docs/apollo-server/data/fetching-rest">Apollo Data Sources</a>.</p>

Many thanks to the author of this [repository](https://github.com/Saeris/tmdb-api), but its functionality did not suit me, and the changes are too big to make a pull request for them. Therefore, a new repository has been created.

## 🛠️ Setup

Install dependencies by running `pnpm install`, then create a new file in the root directory named `.env` (use `example.env` to see options). You'll need to get an API key from The Movie DB in order to run any queries. For more information, please read the [Movie DB docs](https://developers.themoviedb.org/3/getting-started/introduction). In your new `.env` file, copy + paste the following and replace the text following the `=` sign with your newly create API keys.

`.env.example`:

```
# Basic
GRAPHQL_PATH=
LOGGER_LEVEL=
MOVIE_DB_API_V4_KEY=
MOVIE_DB_API_V3_KEY=

# Only for express environment
PORT=

# Cloudflare KV (KV name is not specified here, it is specified in your Cloudflare account)
# In code used name GRAPHQL_CACHE
USE_CF_KV=
```

## Commands

From `package.json`:

```json
"scripts": {
  "dev": "nodemon",                                                 // Run in dev mode (with watching files)
  "serve": "ts-node src/index.ts",                                  // Run node entrypoint
  "build": "tsup",                                                  // Build node version
  "preview": "node -r dotenv/config dist/node/esm/index.js",        // Preview builded node version
  "check": "tsc --noEmit",                                          // Check types
  "format": "prettier --plugin-search-dir . --write ."              // Format code
},
```

For working with Cloudflare Worker version use [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/commands/). I keep `wrangler.toml.example` with my Clodflare Worker configuration.

## Extra

Application compatible with `pnpm` and `npm` package manager. Created patch files for lib `@graphql-tools/schema` for usage with both package managers.
