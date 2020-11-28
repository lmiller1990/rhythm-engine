import {
  Chart,
  nearestNote,
  Input,
  judge,
  Note,
  GameChart,
  updateGameState,
  GameNote
} from '../src/engine'

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
  it('returns timing', () => {
    const input: Input = {
      code: 'K',
      ms: 510
    }
    const note: Note = { id: '1', code: 'K', ms: 500 }
    const actual = judge(input, note)

    expect(actual).toBe(10)
  })
})

describe('updateGameState', () => {
  const baseNote: GameNote = {
    id: '1',
    ms: 0,
    code: 'J',
    canHit: true,
    remainingMs: 1
  }

  it('updates the world given relative to given millseconds', () => {
    // 900 ms has passed since game started
    const current: GameChart = {
      notes: [{ ...baseNote, ms: 1000, remainingMs: 100 }]
    }

    // 50 ms has passed since last update
    const expected: GameChart = {
      notes: [{ ...baseNote, ms: 1000, remainingMs: 50 }]
    }

    const actual = updateGameState({ chart: current, ms: 950 })
    expect(actual).toEqual(expected)
  })

  it('update game state considering input', () => {
    // 900 ms has passed since game started
    const current: GameChart = {
      notes: [{ ...baseNote, ms: 1000, canHit: true, remainingMs: 100 }]
    }

    // 50 ms has passed since last update
    const expected: GameChart = {
      notes: [
        {
          ...baseNote,
          ms: 1000,
          canHit: false,
          remainingMs: 50,
          hitTiming: -60,
          hitAt: 940
        }
      ]
    }

    const actual = updateGameState({
      chart: current,
      ms: 950,
      input: {
        code: baseNote.code,
        ms: 940
      }
    })

    expect(actual).toEqual(expected)
  })

  it('maintains existing state', () => {
    // t = 400
    const alreadyHitNote: GameNote = {
      ...baseNote,
      id: '1',
      ms: 500,
      canHit: false,
      remainingMs: 100,
      hitTiming: -100
    }

    const current: GameChart = {
      notes: [
        alreadyHitNote,
        { ...baseNote, id: '2', ms: 1000, canHit: true, remainingMs: 600 }
      ]
    }

    // t = 950
    const expected: GameChart = {
      notes: [
        {
          ...alreadyHitNote,
          remainingMs: -450
        },
        {
          ...current.notes[1],
          remainingMs: 50,
          canHit: false,
          hitTiming: -50,
          hitAt: 950
        }
      ]
    }

    const actual = updateGameState({
      chart: current,
      ms: 950,
      input: {
        code: baseNote.code,
        ms: 950
      }
    })

    expect(actual).toEqual(expected)
  })

  it('does not allow hitting same note twice', () => {
    const note: GameNote = { ...baseNote, ms: 100, canHit: false, hitAt: 100, hitTiming: 0 }
    const current: GameChart = {
      notes: [note]
    }

    const expected: GameChart = {
      notes: [{ ...note, remainingMs: 10 }]
    }

    const actual = updateGameState({
      chart: current,
      ms: 90,
      input: {
        code: note.code,
        ms: 90
      }
    })

    expect(actual).toEqual(expected)
  })
})
