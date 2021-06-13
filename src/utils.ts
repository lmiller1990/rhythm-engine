import { Chart } from "./engine"

export function prettyTimeElapsed(ms: number) {
  if (ms < 100) {
    return `0.0s`
  }

  return `${(ms / 1000).toFixed(1)}s`
}

/**
 * Return time of last note given a chart.
 * This does not consider any offset or delay.
 * It simply sorts the notes by their ms and returns
 * the largest one.
 */
export function timeOfLastNote(chart: Chart) {
  if (chart.notes.length === 0) {
    throw Error(`No notes in chart!`)
  }

  return chart.notes.sort((x, y) => y.ms - x.ms)[0].ms
}