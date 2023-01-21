import { createServer, type DataSourcesContext } from "./apollo/server"
import { expressMiddleware } from "@apollo/server/express4"
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer"
import express from "express"
import http from "http"
import cors from "cors"
import bodyParser from "body-parser"
import { models } from "./models"
import { createDataSources } from "./sources"
import { setupReporting, type LoggerLevel } from "./lib/reporting"

import {
  MOVIE_DB_API_V3_KEY,
  MOVIE_DB_API_V4_KEY,
  GRAPHQL_PATH,
  PORT,
  LOGGER_LEVEL
} from "./lib/env"

const logger = setupReporting(LOGGER_LEVEL as LoggerLevel)

const app = express()
const httpServer = http.createServer(app)

const server = createServer((config) => ({
  ...config,
  plugins: [
    ...(config.plugins || []),
    ApolloServerPluginDrainHttpServer({ httpServer })
  ]
}))

server.start().then(() => {
  app.use(
    GRAPHQL_PATH ?? "/graphql",
    cors<cors.CorsRequest>(),
    bodyParser.json({ limit: "50mb" }),
    expressMiddleware(server, {
      context: async () => {
        const context: DataSourcesContext = {
          models,
          logger,
          v3apiKey: MOVIE_DB_API_V3_KEY,
          v4apiKey: MOVIE_DB_API_V4_KEY
        }
        const cache = server.cache
        return {
          ...context,
          dataSources: createDataSources({ cache, context })
        }
      }
    })
  )

  httpServer.listen(+(PORT ?? 4000), () => {
    console.log(
      `🚀 Server ready at http://localhost:${PORT ?? 4000}${
        GRAPHQL_PATH ?? "/graphql"
      }`
    )
  })
})
