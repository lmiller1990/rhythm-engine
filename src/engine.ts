/**
 * Represents the abstract idea of a Note, for example in a note chart you load from a text file, etc.
 */
export interface ChartNote {
  id: string
  ms: number
  code: string
}

export interface Chart {
  notes: ChartNote[]
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
      Math.abs(note.ms - input.ms) < Math.abs(best.ms - input.ms)
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
  input?: Input
}

interface JudgementResult {
  noteId: string
  timing: number
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
      noteId: note.id
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
  const judgementResult = world.input && judgeInput(world.input, world.chart)

  return {
    notes: world.chart.notes.map<GameNote>((note) => {
      const timing =
        judgementResult &&
        judgementResult.noteId === note.id &&
        judgementResult.timing

      if (!note.canHit || !timing) {
        return note
      }

      return {
        ...note,
        hitAt: world.input!.ms,
        canHit: false,
        hitTiming: timing
      }
    })
  }
}
