export interface Note {
  id: string
  ms: number
  code: string
}

export interface Chart {
  notes: Note[]
}

export interface Input {
  ms: number
  code: string
}

export function nearestNote(input: Input, chart: Chart) {
  return chart.notes.reduce((best, note) => {
    if (
      input.code === note.code && 
      Math.abs(note.ms - input.ms) < Math.abs(best.ms - input.ms)
    ) {
      return note
    }
    return best
  }, chart.notes[0])
}

export function judge(input: Input, note: Note): number {
  return input.ms - note.ms 
}