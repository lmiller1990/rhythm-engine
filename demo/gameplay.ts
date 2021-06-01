import {
  updateGameState,
  GameChart,
  initGameState,
  GameNote,
  Input,
  EngineConfiguration
} from '../src'
import { uberRave } from './charts'
import { Song } from './selectSong'

interface UINote extends GameNote {
  $el: HTMLDivElement
}

interface UIConfig {
  noteWidth: number
  noteHeight: number
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

declare global {
  interface Window {
    timingFlash: (payload: {
      column: Column
      timingWindowName: string | undefined
    }) => void
  }
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
      windowMs: 50
    },
    {
      name: 'great',
      windowMs: 100
    }
  ]
}

let inputs: Input[] = []
let playing = false
let firstStart = true
let nextAnimationFrameId: number

/**
 * Scroll speed. Larger is faster.
 */
const SPEED_MOD_NORMALIZER = 4
const SPEED_MOD = 2.5 / SPEED_MOD_NORMALIZER

/**
 * Amount of time to wait after the last note in the chart
 * before ending the song.
 */
const SONG_END_ADDITIONAL_DELAY = 1000

/**
 * The larger this, the later the song will start playing.
 */
const GLOBAL_DELAY = 2100
const MACHINE_DELAY = 100

const DELAY = GLOBAL_DELAY + MACHINE_DELAY

/**
 * Add a class to the targets to make it feel like
 * you "hit" them.
 * @param $el {HTMLDivElement} should be a target element
 */
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

/**
 * Trigger a flash showing the timing for a note
 * above the relevant column
 */
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

  // targetFlash($col)
  $col.appendChild($timing)
}

let previousFrameTime: number
let loops: number
const fps: number[] = []
const $fps = document.querySelector<HTMLDivElement>('#fps')!

/**
 * The game loop! This is where literally everything happens.
 */
export function gameLoop(world: UIWorld) {
  const time = performance.now()

  if (!previousFrameTime) {
    previousFrameTime = time
  }

  if (!playing && time - world.core.offset >= GLOBAL_DELAY) {
    audio.play()
    playing = true
  }

  let timeToUpdate = performance.now()
  const newGameState = updateGameState(
    {
      time,
      chart: world.core.chart,
      inputs
    },
    config
  )
  timeToUpdate = performance.now() - timeToUpdate

  timeToUpdate = performance.now()
  if (newGameState.previousFrameMeta.judgementResults.length) {
    // some notes were judged on the previous window
    for (const judgement of newGameState.previousFrameMeta.judgementResults) {
      const note = newGameState.chart.notes.get(judgement.noteId)
      if (!note) {
        throw Error(
          `Could not judged note with id ${judgement.noteId}. This should never happen.`
        )
      }
      window.timingFlash({
        column: note.code as Column,
        timingWindowName: note.timingWindowName
      })
    }
  }

  timeToUpdate = performance.now()
  for (const [id, theNote] of newGameState.chart.notes) {
    if (!theNote) {
      // this should not happen
      throw Error('Could not find note')
    }

    if (theNote.hitAt) {
      world.shell.notes[id].$el.remove()
    } else {
      const yPos = world.shell.notes[id].ms + DELAY - world.core.time
      if (yPos < 500) {
        world.shell.notes[id].$el.style.top = `${yPos * SPEED_MOD}px`
      }
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

  // we already handled the inputs - clear them for the next frame.
  if (inputs.length) {
    inputs = []
  }

  loops += 1

  if (time - previousFrameTime > 1000) {
    // it has been more than 1s between frames
    // report fps
    fps.push(loops)
    $fps.textContent = fps.join(',')
    loops = 0
    previousFrameTime = time
  }
  nextAnimationFrameId = requestAnimationFrame(() => gameLoop(newWorld))
}

const notes: Record<string, UINote> = {}

function $createNote(
  note: GameNote,
  uiConfig: UIConfig,
  $chart: HTMLDivElement
): HTMLDivElement {
  const $note = document.createElement('div')
  $note.className = 'ui-note'
  $note.style.left = `${(parseInt(note.code) - 1) * uiConfig.noteWidth}px`
  notes[note.id] = {
    ...note,
    $el: $note
  }
  $chart.appendChild($note)
  return $note
}

function drawInitialNotes(gameChart: GameChart, $chart: HTMLDivElement) {
  const uiConfig = getUiConfig()

  for (const [id, note] of gameChart.notes) {
    const $note = $createNote(note, uiConfig, $chart)
    $note.style.top = `${Math.round((note.ms + DELAY) * SPEED_MOD)}px`
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

let audio: HTMLAudioElement

window.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.code === 'KeyR' && playing) {
    const $chart = injectChartElement()
    start($chart)
  }
})

function getUiConfig() {
  return JSON.parse(
    document.querySelector<HTMLDivElement>('#config')!.dataset['config'] || ''
  ) as UIConfig
}

export function initInterface($chart: HTMLDivElement) {
  const uiConfig = getUiConfig()
  console.log($chart)

  // Create the targets.
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

  const style = `
.ui-note {
  width: ${uiConfig.noteWidth}px;
  height: ${uiConfig.noteHeight}px;
}
#${$chart.id} {
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
}

function start($chart: HTMLDivElement) {
  if (firstStart) {
    firstStart = false
  }

  initInterface($chart)

  if (nextAnimationFrameId) {
    cancelAnimationFrame(nextAnimationFrameId)
  }

  audio.volume = 0.1
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

  let timeOfLastNote: number | undefined
  gameChart.notes.forEach((note) => {
    if (!timeOfLastNote) {
      timeOfLastNote = note.ms
    } else {
      if (note.ms > timeOfLastNote) {
        timeOfLastNote = note.ms
      }
    }
  })

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

export function initGameplayElements() {
  const $game = document.createElement('div')
  $game.id = 'game'
  const $chartNotes = document.createElement('div')
  $chartNotes.id = 'chart-notes'
  $game.appendChild($chartNotes)
  document.body.insertAdjacentElement('afterbegin', $game)
}

export function initializeAudio(song: Song, onCanPlayThrough?: () => void) {
  audio = document.createElement('audio')
  if (onCanPlayThrough) {
    audio.addEventListener('canplaythrough', onCanPlayThrough)
  }
  audio.src = `/resources/${song.src}`
}

export function injectChartElement() {
  const $chart = document.createElement('div')
  const id = 'chart-notes'
  $chart.id = id

  let $old = document.getElementById(id)
  if ($old) {
    $old.parentElement?.replaceChild($chart, $old)
  } else {
    document.body.insertAdjacentElement('afterbegin', $chart)
  }

  return $chart
}

export function initializeGameplayEvents(song: Song) {
  let hasStarted = false
  initializeAudio(song, () => {
    if (!hasStarted) {
      hasStarted = true
      const $chart = injectChartElement()
      start($chart)
    }
  })
}
