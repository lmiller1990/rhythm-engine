export interface Note {
  id: string
  ms: number
  code: string
}

export interface Chart {
  notes: Note[]
}

export interface GameNote extends Note {
  canHit: boolean
  hitTiming?: number
  hitAt?: number
}

export interface GameChart {
  notes: GameNote[]
}

export interface Input {
  ms: number
  code: string
}

export function nearestNote(input: Input, chart: Chart): Note | undefined {
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

export function judge(input: Input, note: Note): number {
  return input.ms - note.ms
}

interface World {
  chart: GameChart
  ms: number
  input?: Input
}

interface JudgementResult {
  noteId: string
  timing: number
}

function judgeInput(input: Input, chart: Chart): JudgementResult | undefined {
  const note = nearestNote(input, chart)
  if (note) {
    return {
      timing: judge(input, note),
      noteId: note.id
    }
  }
}

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

export function updateGameState(world: World): GameChart {
  const judgementResult = world.input && judgeInput(world.input, world.chart)

  return {
    notes: world.chart.notes.map<GameNote>((note) => {
      const timing =
        judgementResult && judgementResult.noteId === note.id
          ? judgementResult.timing
          : undefined

      if (!note.canHit) {
        return note
      }

      return {
        ...note,
        hitAt: timing ? world.input!.ms : note.hitAt,
        canHit: timing ? !timing : note.canHit,
        hitTiming: timing || note.hitTiming
      }
    })
  }
}
