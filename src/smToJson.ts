import fs from 'fs'
import { Chart, ChartNote } from './engine'

export type Measure = string[]

export function readChart(file: string): Measure[] {
  const text = fs.readFileSync(file, 'utf-8')
  const lines = text.split('\n')

  const measures = lines.reduce<{
    allMeasures: Measure[]
    currentMeasure: string[]
  }>(
    (acc, curr) => {
      if (curr.includes(',')) {
        return {
          allMeasures: [...acc.allMeasures, acc.currentMeasure],
          currentMeasure: []
        }
      }

      return {
        ...acc,
        currentMeasure: acc.currentMeasure.concat(curr.trim())
      }
    },
    {
      allMeasures: [],
      currentMeasure: []
    }
  )

  return measures.allMeasures
}

export function toJsonChart({
  measures,
  bpm,
  offset
}: {
  measures: Measure[]
  bpm: number
  offset: number
}): Chart {
  const fourth = (60 / bpm) * 1000
  const eighth = fourth / 2
  const sixteenth = fourth / 2 / 2

  // figure out notes per measure.
  // eg 4ths, 8ths...
  // for now we assume constant bpm!
  let measureNumber = 0
  let count = 1
  const notes: ChartNote[] = []

  for (const measure of measures) {
    const measureRelativeToStart = measureNumber * fourth * 4

    for (let row = 0; row < measure.length; row++) {
      // TODO: more generic...
      const multiplier =
        measure.length === 4
          ? fourth
          : measure.length === 8
          ? eighth
          : sixteenth

      const hasNote = measure[row].includes('1')
      const ms = Math.round(
        measureRelativeToStart + (row * multiplier - offset)
      )

      if (!hasNote) {
        continue
      }

      for (let col = 0; col < measure[row].length; col++) {
        if (measure[row][col] === '1') {
          notes.push({
            id: count.toString(),
            code: (col + 1).toString(),
            ms
          })
          count += 1
        }
      }
    }

    measureNumber += 1
  }

  return {
    notes
  }
}
