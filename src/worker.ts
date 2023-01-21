/// <reference types="@cloudflare/workers-types" />
// Use this file as entrypoint for Clouudflare Worker environment

import { createServer, type Context } from "./apollo/server"
import {
  startServerAndCreateCloudflareHandler,
  KVCache
} from "apollo-server-integration-cloudflare-workers"

import { models } from "./models"
import { createDataSources } from "./sources"
import { setupReporting, type LoggerLevel } from "./lib/reporting"

interface Env {
  MOVIE_DB_API_V3_KEY?: string
  MOVIE_DB_API_V4_KEY?: string
  GRAPHQL_PATH?: string
  USE_CF_KV?: string
  LOGGER_LEVEL?: string
}

const VarsCachedMap = {
  logger: {
    value: null as ReturnType<typeof setupReporting> | null,
    key: "" as string | undefined | null
  },
  server: {
    value: null as ReturnType<typeof createServer> | null,
    key: "" as string | undefined | null
  },
  handleGraphQLRequest: {
    value: null as ReturnType<
      typeof startServerAndCreateCloudflareHandler
    > | null,
    key: "" as string | undefined | null
  }
}

const handleRequest = async (request: Request, env: Env) => {
  const { pathname } = new URL(request.url)

  const LoggerKey = env.LOGGER_LEVEL
  if (!VarsCachedMap.logger.value || VarsCachedMap.logger.key !== LoggerKey) {
    VarsCachedMap.logger.value = setupReporting(env.LOGGER_LEVEL as LoggerLevel)
    VarsCachedMap.logger.key = LoggerKey
  }

  const ServerKey = "server"
  if (!VarsCachedMap.server.value || VarsCachedMap.server.key !== ServerKey) {
    VarsCachedMap.server.value = createServer()
    VarsCachedMap.server.key = ServerKey
  }

  const HandlerKey = JSON.stringify({
    kv: env.USE_CF_KV,
    v3apiKey: env.MOVIE_DB_API_V3_KEY,
    v4apiKey: env.MOVIE_DB_API_V4_KEY,
    LoggerKey,
    ServerKey
  })
  if (
    !VarsCachedMap.handleGraphQLRequest.value ||
    VarsCachedMap.handleGraphQLRequest.key !== HandlerKey
  ) {
    VarsCachedMap.handleGraphQLRequest.value =
      startServerAndCreateCloudflareHandler<Context>(
        VarsCachedMap.server.value,
        {
          context: async () => {
            const context: Omit<Context, "dataSources"> = {
              models,
              logger: VarsCachedMap.logger.value!,
              v3apiKey: env.MOVIE_DB_API_V3_KEY,
              v4apiKey: env.MOVIE_DB_API_V4_KEY
            }
            const cache = env.USE_CF_KV
              ? new KVCache()
              : VarsCachedMap.server.value!.cache
            return {
              ...context,
              dataSources: createDataSources({ cache, context })
            }
          }
        }
      )
  }

  try {
    if (pathname === env.GRAPHQL_PATH) {
      // @ts-expect-error: request typing missmatched in apollo integration and cloudflare worker
      return await VarsCachedMap.handleGraphQLRequest.value(request)
    }

    return new Response("Not found", { status: 404 })
  } catch (err: any) {
    return new Response("Something went wrong", {
      status: 500
    })
  }
}

const fetch: ExportedHandlerFetchHandler<Env> = async (request, env) => {
  return await handleRequest(request, env)
}

export default { fetch }
