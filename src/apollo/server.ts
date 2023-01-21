import { ApolloServer, type ApolloServerOptions } from "@apollo/server"
import { models } from "../models"
import { resolvers, typeDefs } from "./schema"
import { createDataSources } from "../sources"
import { setupReporting, type Logger } from "../lib/reporting"

import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default"

export interface Context {
  language?: string
  models: typeof models
  v4apiKey?: string
  v3apiKey?: string
  logger: Logger
  dataSources: ReturnType<typeof createDataSources>
}
export type DataSourcesContext = Omit<Context, "dataSources">

const logger = setupReporting("debug")

type Config = ApolloServerOptions<Context>

export const config: Config = {
  typeDefs,
  resolvers,
  logger,
  introspection: true,
  plugins: [
    ApolloServerPluginLandingPageLocalDefault({
      footer: false,
      embed: true
    })
  ]
}

// export const server = new ApolloServer(config)
export const createServer = (
  patchConfig: (_: Config) => Config = (conf) => conf
) => {
  const patchedConfig = patchConfig(config)
  return new ApolloServer(patchedConfig)
}
