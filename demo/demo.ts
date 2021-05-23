import {
  updateGameState,
  GameChart,
  initGameState,
  GameNote,
  Input,
  EngineConfiguration,
  Chart
} from '../dist'
import { uberRave } from './charts'

interface UINote extends GameNote {
  $el: HTMLDivElement
}

export type Column = '1' | '2' | '3' | '4'

const mapping: Record<
  'KeyM' | 'Comma' | 'Period' | 'Slash' | string,
  Column
> = {
  KeyM: '1',
  Comma: '2',
  Period: '3',
  Slash: '4'
}

const config: EngineConfiguration = {
  maxHitWindow: 50,
  timingWindows: [
    {
      name: 'perfect',
      windowMs: 40
    },
    {
      name: 'great',
      windowMs: 100
    }
  ]
}

interface UIWorld {
  core: {
    time: number
    chart: GameChart
    offset: number
    timeOfLastNote: number | undefined
  }
  shell: {
    notes: Record<string, UINote>
  }
}

let inputs: Input[] = []
let playing = false
const SPEED_MOD_NORMALIZER = 4
const SPEED_MOD = 1 / SPEED_MOD_NORMALIZER
const SONG_END_ADDITIONAL_DELAY = 1000
let nextAnimationFrameId: number

const uiConfig = JSON.parse(
  document.querySelector<HTMLDivElement>('#config')!.dataset['config'] || ''
) as { noteWidth: number; noteHeight: number }

const style = `
.ui-note {
  width: ${uiConfig.noteWidth}px;
  height: ${uiConfig.noteHeight}px;
}
#chart-notes {
  width: ${uiConfig.noteWidth * 4}px;
  height: ${uiConfig.noteHeight}px;
}
.note-target {
  width: ${uiConfig.noteWidth}px;
}
`

const sheet = document.createElement('style')
sheet.textContent = style
document.body.append(sheet)

// the larger this, the later the song will start playing.
const GLOBAL_DELAY = 2100
const MACHINE_DELAY = 100

const DELAY = GLOBAL_DELAY + MACHINE_DELAY

let state: UIWorld

// @ts-ignore
window.logWorld = () => {
  console.log(state)
}

function targetFlash($el: HTMLDivElement) {
  $el.classList.remove('note-target-hl')
  void $el.offsetWidth
  $el.classList.add('note-target-hl')
}

/**
 * Select a target by column (1,2,3,4...)
 * A target is just a HTMLDivElement with a
 * data selector.
 */
function selectTargetByColumn(column: Column) {
  const sel = `[data-note-target-col="${column}"]`
  const $col = document.querySelector<HTMLDivElement>(sel)

  if (!$col) {
    throw Error(
      `Could not find column with number ${column}. Used querySelector([${sel}]).`
    )
  }

  return $col
}

window.timingFlash = (payload: {
  column: Column
  timingWindowName: string | undefined
}) => {
  const $col = selectTargetByColumn(payload.column)

  const $timing = document.createElement('div')
  $timing.className = `note-target-timing timing-${
    payload.timingWindowName ?? ''
  }`
  $timing.textContent = payload.timingWindowName ?? null

  targetFlash($col)
  $col.appendChild($timing)
}

declare global {
  interface Window {
    timingFlash: (payload: {
      column: Column
      timingWindowName: string | undefined
    }) => void
  }
}

export function gameLoop(world: UIWorld) {
  const time = performance.now()
  // if (time > 3000) {
  //   return
  // }

  if (!playing && time - world.core.offset >= GLOBAL_DELAY) {
    audio.play()
    playing = true
  }

  const newGameState = updateGameState(
    {
      time,
      chart: world.core.chart,
      inputs
    },
    config
  )

  if (newGameState.previousFrameMeta.judgementResults.length) {
    // some notes were judged on the previous window
    for (const judgement of newGameState.previousFrameMeta.judgementResults) {
      const note = newGameState.chart.notes.find(
        (x) => x.id === judgement.noteId
      )!
      window.timingFlash({
        column: note.code as Column,
        timingWindowName: note.timingWindowName
      })
    }
  }

  for (const note of newGameState.chart.notes) {
    const theNote = world.core.chart.notes.find((x) => x.id === note.id)
    if (!theNote) {
      // this should not happen
      throw Error('Could not find note')
    }

    if (theNote.hitAt) {
      world.shell.notes[note.id].$el.remove()
    } else {
      const yPos = world.shell.notes[note.id].ms + DELAY - world.core.time
      world.shell.notes[note.id].$el.style.top = `${yPos * SPEED_MOD}px`
    }
  }

  // this is the amount of time that has passed since the
  // first note has passed the targets.
  // if this number is greater than the last note in the
  // chart, the song has finished.
  const passed = time - world.core.offset - DELAY

  // if there is no timeOfLastNote, the song will play forever.
  if (
    world.core.timeOfLastNote &&
    passed > world.core.timeOfLastNote + SONG_END_ADDITIONAL_DELAY
  ) {
    audio.pause()
    return
  }

  const newWorld: UIWorld = {
    core: {
      timeOfLastNote: world.core.timeOfLastNote,
      offset: world.core.offset,
      time: performance.now() - world.core.offset,
      chart: {
        notes: newGameState.chart.notes
      }
    },
    shell: {
      notes: world.shell.notes
    }
  }

  state = newWorld

  // we already handled the inputs - clear them for the next frame.
  if (inputs.length) {
    inputs = []
  }
  nextAnimationFrameId = requestAnimationFrame(() => gameLoop(newWorld))
}

const notes: Record<string, UINote> = {}

const $chart = document.querySelector<HTMLDivElement>('#chart-notes')!

for (let i = 1; i < 5; i++) {
  const $noteTarget = document.createElement('div')
  $noteTarget.dataset.noteTargetCol = i.toString()
  $noteTarget.className = 'note-target'
  if (i === 1) {
    $noteTarget.classList.add('note-target-first')
  }

  if (i === 4) {
    $noteTarget.classList.add('note-target-last')
  }

  $chart.appendChild($noteTarget)
}

function drawInitialNotes(gameChart: GameChart, $chart: HTMLDivElement) {
  for (const note of gameChart.notes) {
    const $note = document.createElement('div')
    $note.className = 'ui-note'
    $note.style.top = `${Math.round((note.ms + DELAY) * SPEED_MOD)}px`
    $note.style.left = `${(parseInt(note.code) - 1) * uiConfig.noteWidth}px`
    notes[note.id] = {
      ...note,
      $el: $note
    }
    $chart.appendChild($note)
  }
}

function initKeydownListener(offset: number) {
  window.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.code === 'Slash') {
      event.preventDefault()
    }
    const code = mapping[event.code]
    if (!code) {
      return
    }

    const $target = selectTargetByColumn(code)
    targetFlash($target)

    inputs.push({ ms: event.timeStamp - offset - DELAY, code })
  })
}

const audio = document.createElement('audio')

window.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.code === 'KeyR') {
    start()
  }
})

function start() {
  if (nextAnimationFrameId) {
    cancelAnimationFrame(nextAnimationFrameId)
  }
  audio.volume = 0.1
  audio.src = '/resources/uber-rave.mp3'
  playing = false
  audio.pause()
  audio.currentTime = 0

  // initialize game state
  const gameChart = initGameState(uberRave)

  // clear existing notes (in case of song restart)
  $chart.querySelectorAll('.ui-note').forEach((node) => node.remove())

  drawInitialNotes(gameChart, $chart)

  const offset = performance.now()

  // initialize inputs (for hitting notes)
  initKeydownListener(offset)

  const timeOfLastNote =
    gameChart.notes.sort((x, y) => y.ms - x.ms)?.[0]?.ms ?? undefined

  const world: UIWorld = {
    core: {
      time: 0,
      chart: gameChart,
      offset,
      timeOfLastNote
    },
    shell: {
      notes
    }
  }

  nextAnimationFrameId = requestAnimationFrame(() => gameLoop(world))
}

document.querySelector('#start')!.addEventListener('click', () => {
  start()
})
