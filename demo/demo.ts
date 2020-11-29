import {
  updateGameState,
  GameChart,
  initGameState,
  GameNote,
  Input,
} from '../dist'
import { uberRave } from './charts'

interface UINote extends GameNote {
  $el: HTMLDivElement
}

let end = false

setTimeout(() => (end = true), 20000)

export type Column = '1' | '2' | '3' | '4'

const mapping: Record<'KeyM' | 'Comma' | 'Period' | 'Slash' | string, Column> = {
  'KeyM': '1',
  'Comma': '2',
  'Period': '3',
  'Slash': '4',
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
    for (const attr of ['id', 'hitTiming', 'code', 'ms', 'canHit', 'hitAt']) {
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
const SPEED_MOD = 2
const songOffset = 2000

export function gameLoop(world: UIWorld) {
  const time = performance.now()
  if (!playing && time - world.core.offset >= songOffset) {
    audio.play()
    playing = true
  }

  const newGameState = updateGameState({
    time,
    chart: world.core.chart,
    inputs
  })

  for (const note of newGameState.notes) {
    const yPos = world.shell.notes[note.id].ms - world.core.time
    world.shell.notes[note.id].$el.style.top = `${yPos / SPEED_MOD}px`
  }

  const newWorld: UIWorld = {
    core: {
      offset: world.core.offset,
      time: performance.now() - world.core.offset,
      chart: newGameState
    },
    shell: {
      notes: world.shell.notes
    }
  }

  if (inputs) {
    updateDebug(newWorld)
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

for (const note of gameChart.notes) {
  const $note = document.createElement('div')
  $note.className = 'ui-note'
  $note.style.top = `${Math.round(note.ms / SPEED_MOD)}px`
  $note.style.left = `${(parseInt(note.code) - 1) * 25}px`
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

    inputs.push({ ms: event.timeStamp - offset, code })
  })
}

const audio = document.createElement('audio')
document.querySelector('#end')!.addEventListener('click', () => {
  end = true
})

document.querySelector('#start')!.addEventListener('click', () => {
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
  updateDebug(world)

  requestAnimationFrame(() => gameLoop(world))
})
