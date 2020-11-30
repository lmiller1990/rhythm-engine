import {
  Chart,
  updateGameState,
  judgeInput,
  JudgementResult,
  EngineConfiguration,
  nearestNote,
  Input,
  judge,
  ChartNote,
  GameChart,
  GameNote,
  createChart
} from '../src/engine'

const engineConfiguration: EngineConfiguration = {
  maxHitWindow: 100
}

describe('nearestNode', () => {
  it('captures nearest note based on time and input', () => {
    const chart: Chart = {
      notes: [
        { id: '1', ms: 0, code: 'K' },
        { id: '2', ms: 500, code: 'J' },
        { id: '3', ms: 1000, code: 'K' }
      ]
    }
    const actual = nearestNote({ ms: 600, code: 'K' }, chart)

    expect(actual).toBe(chart.notes[2])
  })

  it('handles chart with no notes', () => {
    const chart: Chart = {
      notes: []
    }
    const actual = nearestNote({ ms: 600, code: 'K' }, chart)

    expect(actual).toBe(undefined)
  })

  it('handles chart with no valid notes', () => {
    const chart: Chart = {
      notes: [{ id: '1', ms: 100, code: 'J' }]
    }
    const actual = nearestNote({ ms: 600, code: 'K' }, chart)

    expect(actual).toBe(undefined)
  })
})

describe('judgeInput', () => {
  it('judges input within max window', () => {
    const input: Input = {
      code: 'K',
      ms: 100
    }
    // inside max input window of 100
    const note: ChartNote = { id: '1', code: 'K', ms: 200 }
    const actual = judgeInput({
      input,
      chart: { notes: [note] },
      maxWindow: 100
    })

    expect(actual).toEqual<JudgementResult>({
      noteId: '1',
      time: 100,
      timing: -100
    })
  })

  it('does not judge input outside max window', () => {
    const input: Input = {
      code: 'K',
      ms: 100
    }
    // outside max input window of 100 by 1
    const note: ChartNote = { id: '1', code: 'K', ms: 201 }
    const actual = judgeInput({
      input,
      chart: { notes: [note] },
      maxWindow: 100
    })

    expect(actual).toBe(undefined)
  })
})

describe('judge', () => {
  it('returns timing', () => {
    const input: Input = {
      code: 'K',
      ms: 510
    }
    const note: ChartNote = { id: '1', code: 'K', ms: 500 }
    const actual = judge(input, note)

    expect(actual).toBe(10)
  })

  it('awards perfect timing for hold notes', () => {
    const input: Input = {
      code: 'K',
      ms: 510
    }
    const note: ChartNote = { id: '1', code: 'K', ms: 500, dependsOn: '1' }
    const actual = judge(input, note)

    expect(actual).toBe(0)
  })
})

describe('updateGameState', () => {
  const baseNote: GameNote = {
    id: '1',
    ms: 0,
    code: 'J',
    canHit: true
  }

  it('updates the world given relative to given millseconds', () => {
    // 900 ms has passed since game started
    const current: GameChart = {
      notes: [{ ...baseNote, ms: 1000 }]
    }

    // 50 ms has passed since last update
    const expected: GameChart = {
      notes: [{ ...baseNote, ms: 1000 }]
    }

    const actual = updateGameState(
      { chart: current, time: 950, inputs: [] },
      engineConfiguration
    )
    expect(actual).toEqual(expected)
  })

  it('update game state considering input', () => {
    // 900 ms has passed since game started
    const current: GameChart = {
      notes: [{ ...baseNote, ms: 1000, canHit: true }]
    }

    // 50 ms has passed since last update
    const expected: GameChart = {
      notes: [
        {
          ...baseNote,
          ms: 1000,
          canHit: false,
          hitTiming: -60,
          hitAt: 940
        }
      ]
    }

    const actual = updateGameState(
      {
        chart: current,
        time: 950,
        inputs: [
          {
            code: baseNote.code,
            ms: 940
          }
        ]
      },
      engineConfiguration
    )

    expect(actual).toEqual(expected)
  })

  it('maintains existing state', () => {
    // t = 400
    const alreadyHitNote: GameNote = {
      ...baseNote,
      id: '1',
      ms: 500,
      canHit: false,
      hitTiming: -100
    }

    const current: GameChart = {
      notes: [alreadyHitNote, { ...baseNote, id: '2', ms: 1000, canHit: true }]
    }

    // t = 950
    const expected: GameChart = {
      notes: [
        {
          ...alreadyHitNote
        },
        {
          ...current.notes[1],
          canHit: false,
          hitTiming: -50,
          hitAt: 950
        }
      ]
    }

    const actual = updateGameState(
      {
        chart: current,
        time: 950,
        inputs: [
          {
            code: baseNote.code,
            ms: 950
          }
        ]
      },
      engineConfiguration
    )

    expect(actual).toEqual(expected)
  })

  it('does not allow hitting same note twice', () => {
    const note: GameNote = {
      ...baseNote,
      ms: 100,
      canHit: false,
      hitAt: 100,
      hitTiming: 0
    }
    const current: GameChart = {
      notes: [note]
    }

    const expected: GameChart = {
      notes: [{ ...note }]
    }

    const actual = updateGameState(
      {
        chart: current,
        time: 90,
        inputs: [
          {
            code: note.code,
            ms: 90
          }
        ]
      },
      engineConfiguration
    )

    expect(actual).toEqual(expected)
  })

  it('supports simultaneous inputs', () => {
    const aNote: GameNote = {
      ...baseNote,
      ms: 100
    }
    const current: GameChart = {
      notes: [
        { ...aNote, id: '1', code: 'J' },
        { ...aNote, id: '2', code: 'K' }
      ]
    }

    const expected: GameChart = {
      notes: [
        {
          ...aNote,
          id: '1',
          code: 'J',
          hitAt: 100,
          canHit: false,
          hitTiming: 0
        },
        {
          ...aNote,
          id: '2',
          code: 'K',
          hitAt: 100,
          canHit: false,
          hitTiming: 0
        }
      ]
    }

    const actual = updateGameState(
      {
        chart: current,
        time: 100,
        inputs: [
          {
            code: 'J',
            ms: 100
          },
          {
            code: 'K',
            ms: 100
          }
        ]
      },
      engineConfiguration
    )

    expect(actual).toEqual(expected)
  })
})

describe('createChart', () => {
  it('returns a new chart considering offset', () => {
    const expected: Chart = {
      notes: [{ id: '1', ms: 1100, code: 'J' }]
    }
    const actual = createChart({
      notes: [{ id: '1', ms: 1000, code: 'J' }],
      offset: 100
    })

    expect(actual).toEqual(expected)
  })
})
