import { prettyTimeElapsed } from "../src/utils"

type TestTuple = [number, string];

describe('prettyTimeElapsed', () => {
  const table: TestTuple[] = [
    [1, "0.0s"],
    [90, "0.0s"],
    [102, "0.1s"],
    [1040, "1.0s"],
    [1000, "1.0s"],
    [1500, "1.5s"],
    [10000, "10.0s"],
    [11205, "11.2s"],
  ]

  it.each<TestTuple>(table)('works with %i', (ms: number, actual: string) => {
    expect(prettyTimeElapsed(ms)).toBe(actual)
  })
})