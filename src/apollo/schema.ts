import {
  resolvers as scalarResolvers,
  typeDefs as scalarTypeDefs
} from "graphql-scalars"
import { types, scalarResolvers as customScalarResolvers } from "../types"
import { resolvers as modelResolvers } from "../resolvers"

export const typeDefs = [...types, ...scalarTypeDefs]
export const resolvers = {
  ...modelResolvers,
  ...scalarResolvers,
  ...customScalarResolvers
}
