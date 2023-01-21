import { GraphQLError } from "graphql"

export class ApolloError extends GraphQLError {
  constructor(message: string) {
    super(message)
    this.name = "ApolloError"
  }
}

export class ForbiddenError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: { code: "FORBIDDEN" }
    })
    this.name = "ForbiddenError"
  }
}

export class AuthenticationError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: { code: "UNAUTHENTICATED" }
    })
    this.name = "AuthenticationError"
  }
}
