import { Chart, nearestNote, Input, judge, Note } from '../src/engine'

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
