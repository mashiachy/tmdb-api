import { RegularExpression } from "graphql-scalars"

const scalar = "scalar LanguageCode"
const resolver = new RegularExpression(
  `LanguageCode`,
  // eslint-disable-next-line prefer-named-capture-group
  /([a-z]{2})-([A-Z]{2})/
)

export { scalar as LanguageCodeScalar, resolver as LanguageCode }
