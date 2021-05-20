import {
  updateGameState,
  GameChart,
  initGameState,
  GameNote,
  Input,
  EngineConfiguration
} from '../dist'
import { uberRave } from './charts'

interface UINote extends GameNote {
  $el: HTMLDivElement
}

let end = false

setTimeout(() => (end = true), 10000)

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
      name: 'fantastic',
      windowMs: 50
    },
    {
      name: 'excellent',
      windowMs: 100
    }
  ]
}

interface UIWorld {
  core: {
    time: number
    chart: GameChart
    offset: number
  }
  shell: {
    notes: Record<string, UINote>
  }
}

let first = true

function updateDebug(world: UIWorld) {
  const $body = document.querySelector('#debug-body')!
  $body.innerHTML = ''
  const hide = ['canHit', 'hitAt']

  if (first) {
    for (const attr of hide) {
      const $th = document.querySelector(`[data-debugid="${attr}"]`)!
      $th.remove()
    }
    first = false
  }

  for (const note of world.core.chart.notes) {
    const $tr = document.createElement('tr')
    for (const attr of [
      'id',
      'hitTiming',
      'timingWindowName',
      'code',
      'ms',
      'canHit',
      'hitAt'
    ]) {
      if (hide.includes(attr)) {
        continue
      }

      const $td = document.createElement('td')
      // @ts-ignore
      $td.innerText = note[attr]
      $tr.append($td)
    }
    $body.append($tr)
  }
}

let inputs: Input[] = []
let playing = false
const SPEED_MOD = 1.5

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

const el = document.querySelector<HTMLDivElement>('.fantastic')!

window.timingFlash = (column: Column) => {
  const sel = `[data-note-target-col="${column}"]`
  const $col = document.querySelector(sel)!
  $col.classList.remove('note-target-hl')
  void el.offsetWidth
  $col.classList.add('note-target-hl')
}

declare global {
  interface Window {
    timingFlash: (column: Column) => void
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
      const note = newGameState.chart.notes.find(x => x.id === judgement.noteId)!
      window.timingFlash(note.code as Column)
    }
  }

  for (const note of newGameState.chart.notes) {
    const theNote = world.core.chart.notes.find(x => x.id === note.id)
    if (!theNote) {
      // this should not happen
      throw Error('Could not find note')
    }

    if (theNote.hitAt) {
      world.shell.notes[note.id].$el.remove()
    } else {
      const yPos = world.shell.notes[note.id].ms + DELAY - world.core.time
      world.shell.notes[note.id].$el.style.top = `${yPos / SPEED_MOD}px`
    }
  }

  const newWorld: UIWorld = {
    core: {
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

  if (inputs.length) {
    // updateDebug(newWorld)
    inputs = []
  }

  if (end) {
    audio.pause()
    return
  }

  requestAnimationFrame(() => gameLoop(newWorld))
}

const gameChart = initGameState(uberRave)

const notes: Record<string, UINote> = {}

const $chart = document.querySelector('#chart-notes')!

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

for (const note of gameChart.notes) {
  const $note = document.createElement('div')
  $note.className = 'ui-note'
  $note.style.top = `${Math.round((note.ms + DELAY) / SPEED_MOD)}px`
  $note.style.left = `${(parseInt(note.code) - 1) * uiConfig.noteWidth}px`
  notes[note.id] = {
    ...note,
    $el: $note
  }
  $chart.appendChild($note)
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
    inputs.push({ ms: event.timeStamp - offset - DELAY, code })
  })
}

const audio = document.createElement('audio')
document.querySelector('#end')!.addEventListener('click', () => {
  end = true
})

document.querySelector('#start')!.addEventListener('click', () => {
  audio.volume = 0.1
  audio.src = '/resources/uber-rave.mp3'

  const offset = performance.now()
  initKeydownListener(offset)

  const world: UIWorld = {
    core: {
      time: 0,
      chart: gameChart,
      offset
    },
    shell: {
      notes
    }
  }
  // updateDebug(world)

  requestAnimationFrame(() => gameLoop(world))
})
