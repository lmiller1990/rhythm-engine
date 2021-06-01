import { World, GameNote } from '../src/engine'
import { Summary, summarizeResults } from '../src/scoring'

const createNote = (
  id: string,
  ms: number,
  hitAt: number | undefined,
  timingWindowName: string | undefined
) => ({
  id,
  ms,
  timingWindowName,
  hitAt,
  canHit: false,
  code: 'J'
})

describe('scoring', () => {
  it('summarizes results', () => {
    const expected: Summary = {
      timing: {
        perfect: {
          count: 3,
          early: 1,
          late: 1
        },
        great: {
          count: 0,
          early: 0,
          late: 0
        },
        miss: {
          count: 2,
          early: 0,
          late: 0
        }
      }
    }

    const world: World = {
      chart: {
        notes: new Map<string, GameNote>([
          ['1', createNote('1', 100, 110, 'perfect')],
          ['2', createNote('2', 200, 200, 'perfect')],
          ['3', createNote('3', 300, 290, 'perfect')],
          ['4', createNote('4', 300, undefined, undefined)],
          ['5', createNote('5', 300, undefined, undefined)]
        ])
      },
      time: 10000,
      inputs: []
    }

    const actual = summarizeResults(world, ['perfect', 'great'])

    expect(expected).toEqual(actual)
  })
})
