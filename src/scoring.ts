import { World } from './engine'

interface TimingTypeSummary {
  count: number
  early: number
  late: number
}

export interface Summary {
  timing: {
    [key: string]: TimingTypeSummary
  }
}

export function summarizeResults(
  world: World,
  timingWindowNames: readonly string[]
) {
  const summary = timingWindowNames.reduce<Summary>(
    (acc, curr) => {
      return {
        timing: {
          ...acc.timing,
          [curr]: {
            early: 0,
            late: 0,
            count: 0
          }
        }
      }
    },
    {
      timing: {
        miss: {
          count: 0,
          early: 0,
          late: 0
        }
      }
    }
  )

  for (const [id, note] of world.chart.notes) {
    if (!note.timingWindowName && !note.hitAt) {
      // it's a missed note
      // do not consider notes in the future - eg, we should support
      // the use case of showing a summary if failing mid song, etc.
      // note in the future are not considered "missed", since you
      // never had a chance to hit them.
      if (note.hitAt === undefined && note.ms < world.time) {
        summary.timing.miss.count += 1
      }
    }

    if (
      note.timingWindowName &&
      timingWindowNames.includes(note.timingWindowName)
    ) {
      if (note.timingWindowName && !(note.timingWindowName in summary.timing)) {
        // should be impossible - defensive check.
        throw Error(
          `Tried to add note with timing ${
            note.timingWindowName
          } to summary, which is not a validate timing window. Valid windows are: ${timingWindowNames.join(
            ','
          )}`
        )
      }

      // hit note - find correct timing window.
      if (note.hitAt !== undefined) {
        // always increase count
        summary.timing[note.timingWindowName].count += 1

        // early
        if (note.hitAt < note.ms) {
          summary.timing[note.timingWindowName].early += 1
        }

        // late
        if (note.hitAt > note.ms) {
          summary.timing[note.timingWindowName].late += 1
        }
      }
    }
  }

  return summary
}
