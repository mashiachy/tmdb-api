import { ISODateScalar, ISODate } from "./ISODate"
import { LanguageCodeScalar, LanguageCode } from "./LanguageCode"
import { PageRangeScalar, PageRange } from "./PageRange"
import { RegionCodeScalar, RegionCode } from "./RegionCode"
import { ScoreMinimumRangeScalar, ScoreMinimumRange } from "./ScoreMinimumRange"
import { ScoreMaximumRangeScalar, ScoreMaximumRange } from "./ScoreMaximumRange"
// import { gql } from "graphql-tag"

const scalars = [
  ISODateScalar,
  LanguageCodeScalar,
  PageRangeScalar,
  RegionCodeScalar,
  ScoreMinimumRangeScalar,
  ScoreMaximumRangeScalar
] //.map(gql)
const resolvers = {
  ISODate,
  LanguageCode,
  PageRange,
  RegionCode,
  ScoreMinimumRange,
  ScoreMaximumRange
}

export { scalars, resolvers }
