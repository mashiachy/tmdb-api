declare module "*.gql" {
  declare const value: import("graphql").DocumentNode
  export default value
}
declare module "*.graphql" {
  declare const value: import("graphql").DocumentNode
  export default value
}
