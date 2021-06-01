import { readChart, toJsonChart } from '../src/smToJson'
import type { Measure } from '../src/smToJson'
import { Chart, ChartNote } from '../src'

describe('readChart', () => {
  it('cleans a basic sm file', () => {
    const chart = readChart('./tests/fixtures/chart.txt')

    expect(chart[0]).toEqual(['1001', '0001', '0100', '0001'])

    expect(chart[1]).toEqual([
      '0001',
      '1000',
      '0100',
      '1000',
      '0110',
      '0001',
      '1000',
      '0001'
    ])

    expect(chart[2]).toEqual([
      '0010',
      '0100',
      '1000',
      '0001',
      '1000',
      '0100',
      '0010',
      '0001',
      '0010',
      '0100',
      '1000',
      '0001',
      '1000',
      '0010',
      '0100',
      '0001'
    ])
  })
})

describe('toJsonChart', () => {
  it('transforms array of measures into a engine compatible chart', () => {
    // #OFFSET:-0.040;
    const offset = -40
    const chart: Measure[] = [['1000', '0001', '0100', '0001']]

    const expected: Chart = {
      notes: [
        {
          id: '1',
          ms: 40,
          code: '1'
        },
        {
          id: '2',
          ms: 383,
          code: '4'
        },
        {
          id: '3',
          ms: 726,
          code: '2'
        },
        {
          id: '4',
          ms: 1069,
          code: '4'
        }
      ]
    }

    const result = toJsonChart({
      measures: chart,
      bpm: 175,
      offset
    })

    expect(result.notes[0]).toEqual(expected.notes[0])
    expect(result.notes[1]).toEqual(expected.notes[1])
    expect(result.notes[2]).toEqual(expected.notes[2])
    expect(result.notes[3]).toEqual(expected.notes[3])
  })

  it('handles jumps/hands', () => {
    // #OFFSET:-0.040;
    const offset = -40
    const chart: Measure[] = [['1001', '0000', '0000', '0000']]

    const expected: Chart = {
      notes: [
        {
          id: '1',
          ms: 40,
          code: '1'
        },
        {
          id: '2',
          ms: 40,
          code: '4'
        }
      ]
    }

    const result = toJsonChart({
      measures: chart,
      bpm: 175,
      offset
    })

    expect(result.notes[0]).toEqual(expected.notes[0])
    expect(result.notes[1]).toEqual(expected.notes[1])
  })

  it('handles 8ths', () => {
    // #OFFSET:-0.040;
    const offset = -40
    const chart: Measure[] = [
      ['1000', '0000', '0000', '0000', '1000', '0000', '0000', '0000']
    ]

    const expected: Chart = {
      notes: [
        {
          id: '1',
          ms: 40,
          code: '1'
        },
        {
          id: '2',
          ms: 726,
          code: '1'
        }
      ]
    }

    const result = toJsonChart({
      measures: chart,
      bpm: 175,
      offset
    })

    expect(result.notes[0]).toEqual(expected.notes[0])
    expect(result.notes[1]).toEqual(expected.notes[1])
  })

  it('handles 16ths', () => {
    // #OFFSET:-0.040;
    const offset = -40
    const chart: Measure[] = [
      [
        '1000',
        '0000',
        '0000',
        '0000',
        '0000',
        '0000',
        '0000',
        '0000',
        '1000',
        '0000',
        '0000',
        '0000',
        '0000',
        '0000',
        '0000',
        '0000'
      ]
    ]

    const expected: Chart = {
      notes: [
        {
          id: '1',
          ms: 40,
          code: '1'
        },
        {
          id: '2',
          ms: 726,
          code: '1'
        }
      ]
    }

    const result = toJsonChart({
      measures: chart,
      bpm: 175,
      offset
    })

    expect(result.notes[0]).toEqual(expected.notes[0])
    expect(result.notes[1]).toEqual(expected.notes[1])
  })
})
