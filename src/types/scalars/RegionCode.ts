import { RegularExpression } from "graphql-scalars"

const scalar = "scalar RegionCode"
const resolver = new RegularExpression(`RegionCode`, /^[A-Z]{2}$/)

export { scalar as RegionCodeScalar, resolver as RegionCode }
