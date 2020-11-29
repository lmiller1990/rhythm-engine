/**
 * Represents the abstract idea of a Note, for example in a note chart you load from a text file, etc.
 */
export interface ChartNote<Code = string> {
  id: string
  ms: number
  code: Code
}

export interface Chart<Code = string> {
  notes: ChartNote<Code>[]
}

interface CreateChart<Code = string> {
  offset: number
  notes: ChartNote<Code>[]
}

/**
 * Creates a new chart.
 * Handles things like offsetting the notes.
 */
export function createChart<Code = string>(args: CreateChart<Code>): Chart<Code> {
  return {
    notes: args.notes.map((note) => {
      return {
        ...note,
        ms: note.ms + args.offset
      }
    })
  }
}

/**
 * An actual note used by the engine.
 * It has all the properties of a ChartNote, and some
 * gameplay specific ones such as when it was hit, if it can be hit, etc.
 */
export interface GameNote extends ChartNote {
  canHit: boolean
  hitTiming?: number
  hitAt?: number
}

export interface GameChart {
  notes: GameNote[]
}

/**
 * Represents an input from the user.
 * ms is the time of the input in millseconds since
 * the start of the game.
 * Code represents the key - this can be a virtual key, too.
 */
export interface Input {
  ms: number
  code: string
}

/**
 * Finds the "nearest" note given an input and a chart for scoring.
 */
export function nearestNote(input: Input, chart: Chart): ChartNote | undefined {
  const nearest = chart.notes.reduce((best, note) => {
    if (
      input.code === note.code &&
      Math.abs(note.ms - input.ms) <= Math.abs(best.ms - input.ms)
    ) {
      return note
    }
    return best
  }, chart.notes[0])

  return nearest && nearest.code === input.code ? nearest : undefined
}

/**
 * Get the difference between the time the note should have been hit
 * and the actual time it was hit.
 * Useful for scoring systems.
 */
export function judge(input: Input, note: ChartNote): number {
  return input.ms - note.ms
}

/**
 * Represents the current state of the game engine.
 * Chart is the chart selected.
 * Time is how fast we have progressed since the song started.
 * Input will be present if the user made an input when the game
 * was in this state
 */
interface World {
  chart: GameChart
  time: number
  inputs: Input[]
}

interface JudgementResult {
  // the noteId used in this judgement.
  noteId: string

  // how accurate the timing was. + is early. - is late.
  timing: number

  // the time in ms the input was made.
  time: number
}

/**
 * Given an input and a chart, see if there is a note nearby and judge
 * how accurately the player hit it.
 */
function judgeInput(input: Input, chart: Chart): JudgementResult | undefined {
  const note = nearestNote(input, chart)
  if (note) {
    return {
      timing: judge(input, note),
      noteId: note.id,
      time: input.ms
    }
  }
}

// Create a new "world", which represents the play-through of one chart.
export function initGameState(chart: Chart): GameChart {
  return {
    notes: chart.notes.map((note) => {
      return {
        ...note,
        canHit: true
      }
    })
  }
}

/**
 * Returns a new world, given an existing one and (optionally) an input.
 * The only way the world changes is via a user input.
 * Given X world and Y input, the new world will always be Z.
 * That is to say the world in the engine is deterministic - no side effects.
 *
 * If there is no user input, the new world will be identical to the previous one.
 */
export function updateGameState(world: World): GameChart {
  const judgementResults = world.inputs.reduce<JudgementResult[]>((acc, input) => {
    const result = judgeInput(input, world.chart)
    if (result) {
      return acc.concat(result)
    }
    return acc
  }, [])

  return {
    notes: world.chart.notes.map<GameNote>((note) => {
      if (!note.canHit || !judgementResults) {
        return note
      }

      const noteJudgement = judgementResults.find(x => x.noteId === note.id)
      if (noteJudgement && noteJudgement.noteId === note.id) {
        return {
          ...note,
          hitAt: noteJudgement.time,
          canHit: false,
          hitTiming: noteJudgement.timing
        }
      }

      return note
    })
  }
}
