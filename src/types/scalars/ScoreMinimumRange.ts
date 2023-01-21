import { rangeFactory } from "./rangeFactory"

const { scalar, resolver } = rangeFactory({
  name: `ScoreMinimumRange`,
  start: 0,
  end: 10
})

export { scalar as ScoreMinimumRangeScalar, resolver as ScoreMinimumRange }
