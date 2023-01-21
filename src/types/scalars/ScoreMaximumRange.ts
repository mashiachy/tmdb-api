import { rangeFactory } from "./rangeFactory"

const { scalar, resolver } = rangeFactory({
  name: `ScoreMaximumRange`,
  start: 1,
  end: 10
})

export { scalar as ScoreMaximumRangeScalar, resolver as ScoreMaximumRange }
