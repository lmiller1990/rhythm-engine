import {
  Chart,
  updateGameState,
  UpdatedGameState,
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
  maxHitWindow: 100,
  timingWindows: undefined
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
      maxWindow: 100,
      timingWindows: undefined
    })

    expect(actual).toEqual<JudgementResult>({
      noteId: '1',
      time: 100,
      timing: -100,
      timingWindowName: undefined
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
      maxWindow: 100,
      timingWindows: undefined
    })

    expect(actual).toBe(undefined)
  })

  it('considers timing windows when note is inside smallest window', () => {
    const note: ChartNote = { id: '1', code: 'K', ms: 100 }
    const input: Input = {
      code: 'K',
      ms: 111
    }
    const actual = judgeInput({
      input,
      chart: { notes: [note] },
      maxWindow: 100,
      timingWindows: [
        {
          name: 'perfect',
          windowMs: 22
        },
        {
          name: 'great',
          windowMs: 33
        }
      ]
    })

    expect(actual).toEqual<JudgementResult>({
      timing: 11,
      noteId: note.id,
      time: 111,
      timingWindowName: 'perfect'
    })
  })

  it('considers timing windows when note is early inside largest window', () => {
    const note: ChartNote = { id: '1', code: 'K', ms: 100 }
    const input: Input = {
      code: 'K',
      ms: 111
    }
    const actual = judgeInput({
      input,
      chart: { notes: [note] },
      maxWindow: 100,
      timingWindows: [
        {
          name: 'perfect',
          windowMs: 10
        },
        {
          name: 'great',
          windowMs: 33
        }
      ]
    })

    expect(actual).toEqual<JudgementResult>({
      timing: 11,
      noteId: note.id,
      time: 111,
      timingWindowName: 'great'
    })
  })

  it('considers timing windows when note is late inside largest window', () => {
    const note: ChartNote = { id: '1', code: 'K', ms: 100 }
    const input: Input = {
      code: 'K',
      ms: 89
    }

    const actual = judgeInput({
      input,
      chart: { notes: [note] },
      maxWindow: 100,
      timingWindows: [
        {
          name: 'perfect',
          windowMs: 10
        },
        {
          name: 'great',
          windowMs: 33
        }
      ]
    })

    expect(actual).toEqual<JudgementResult>({
      timing: -11,
      noteId: note.id,
      time: 89,
      timingWindowName: 'great'
    })
  })

  it('considers timing windows when note outside all windows', () => {
    const note: ChartNote = { id: '1', code: 'K', ms: 100 }
    const input: Input = {
      code: 'K',
      ms: 150
    }
    const actual = judgeInput({
      input,
      chart: { notes: [note] },
      maxWindow: 100,
      timingWindows: [
        {
          name: 'perfect',
          windowMs: 10
        },
        {
          name: 'great',
          windowMs: 20
        }
      ]
    })

    expect(actual).toEqual<JudgementResult>({
      timing: 50,
      noteId: note.id,
      time: 150,
      timingWindowName: undefined
    })
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
    canHit: true,
    timingWindowName: undefined
  }

  it('updates the world given relative to given millseconds', () => {
    const notes = new Map<string, GameNote>()
    notes.set(baseNote.id, { ...baseNote, ms: 1000 })
    // 900 ms has passed since game started
    const current: GameChart = {
      notes
    }

    // 50 ms has passed since last update
    const expected: UpdatedGameState = {
      chart: {
        notes
      },
      previousFrameMeta: {
        judgementResults: []
      }
    }

    const actual = updateGameState(
      { chart: current, time: 950, inputs: [] },
      engineConfiguration
    )
    expect(actual).toEqual(expected)
  })

  it('update game state considering input', () => {
    // 900 ms has passed since game started
    const notes = new Map<string, GameNote>()
    notes.set(baseNote.id, { ...baseNote, ms: 1000, canHit: true })
    const current: GameChart = {
      notes
    }

    // 50 ms has passed since last update
    const expected: UpdatedGameState = {
      previousFrameMeta: {
        judgementResults: [
          {
            noteId: '1',
            time: 940,
            timing: -60,
            // no timing windows are specified, so we are just using default maxHit
            // this means the timing window is undefined.
            timingWindowName: undefined
          }
        ]
      },
      chart: {
        notes: new Map([
          [
            baseNote.id,
            { ...baseNote, ms: 1000, canHit: false, hitTiming: -60, hitAt: 940 }
          ]
        ])
      }
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

    const upcomingNote: GameNote = {
      ...baseNote,
      id: '2',
      ms: 1000,
      canHit: true
    }

    const current: GameChart = {
      notes: new Map<string, GameNote>([
        ['1', alreadyHitNote],
        ['2', { ...upcomingNote }]
      ])
    }

    // t = 950
    const expected: UpdatedGameState = {
      chart: {
        notes: new Map<string, GameNote>([
          [
            '1',
            {
              ...alreadyHitNote,
              id: '1'
            }
          ],
          [
            '2',
            {
              ...upcomingNote,
              id: '2',
              ms: 1000,
              canHit: false,
              hitTiming: -50,
              hitAt: 950
            }
          ]
        ])
      },
      previousFrameMeta: {
        judgementResults: [
          {
            noteId: '2',
            time: 950,
            timing: -50,
            // no timing windows passed in config.
            timingWindowName: undefined
          }
        ]
      }
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
      notes: new Map<string, GameNote>([[note.id, note]])
    }

    const expected: UpdatedGameState = {
      previousFrameMeta: {
        judgementResults: [
          {
            noteId: '1',
            time: 90,
            timing: -10,
            // no timing windows passed in config.
            timingWindowName: undefined
          }
        ]
      },
      chart: {
        notes: new Map<string, GameNote>([[note.id, { ...note }]])
      }
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
      notes: new Map<string, GameNote>([
        ['1', { ...aNote, id: '1', code: 'J' }],
        ['2', { ...aNote, id: '2', code: 'K' }]
      ])
    }

    const expected: UpdatedGameState = {
      chart: {
        notes: new Map<string, GameNote>([
          [
            '1',
            {
              ...aNote,
              id: '1',
              code: 'J',
              hitAt: 100,
              canHit: false,
              hitTiming: 0
            }
          ],
          [
            '2',
            {
              ...aNote,
              id: '2',
              code: 'K',
              hitAt: 100,
              canHit: false,
              hitTiming: 0
            }
          ]
        ])
      },
      previousFrameMeta: {
        judgementResults: [
          {
            noteId: '1',
            time: 100,
            timing: 0,
            timingWindowName: undefined
          },
          {
            noteId: '2',
            time: 100,
            timing: 0,
            timingWindowName: undefined
          }
        ]
      }
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
