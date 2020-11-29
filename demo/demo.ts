import {
  Chart,
  updateGameState,
  GameChart,
  initGameState,
  GameNote,
  Input,
  createChart
} from '../dist'

const bpm = 175

const randomKey = () => {
  const seed = Math.random()
  if (seed < 0.25) {
    return 'KeyD'
  }
  if (seed >= 0.25 && seed < 0.5) {
    return 'KeyF'
  }
  if (seed >= 0.5 && seed < 0.75) {
    return 'KeyJ'
  }
  if (seed >= 0.75) {
    return 'KeyK'
  }
  throw Error(`${seed} is invalid`)
}

const songOffset = 2000
const chartOffset = 2150

const chart: Chart = createChart({
  offset: chartOffset,
  notes: new Array(30).fill(0).map((_, idx) => {
    const ms = Math.round((1000 / (bpm / 60)) * idx)
    return {
      id: (idx + 1).toString(),
      ms,
      code: randomKey()
    }
  })
})

interface UINote extends GameNote {
  $el: HTMLDivElement
}

let end = false

setTimeout(() => (end = true), 20000)

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

let input: Input | undefined
let playing = false
const SPEED_MOD = 2

export function gameLoop(world: UIWorld) {
  const time = performance.now()
  if (!playing && time - world.core.offset >= songOffset) {
    audio.play()
    playing = true
  }

  const newGameState = updateGameState({
    time,
    chart: world.core.chart,
    input
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

  if (input) {
    updateDebug(newWorld)
    input = undefined
  }

  if (end) {
    audio.pause()
    return
  }

  requestAnimationFrame(() => gameLoop(newWorld))
}

const gameChart = initGameState(chart)

const notes: Record<string, UINote> = {}

const $chart = document.querySelector('#chart-notes')!

for (const note of gameChart.notes) {
  const $note = document.createElement('div')
  $note.className = 'ui-note'
  $note.style.top = `${Math.round(note.ms / SPEED_MOD)}px`
  $note.style.left = (() => {
    if (note.code === 'KeyD') return '0px'
    if (note.code === 'KeyF') return '25px'
    if (note.code === 'KeyJ') return '50px'
    if (note.code === 'KeyK') return '75px'
    return ''
  })()
  notes[note.id] = {
    ...note,
    $el: $note
  }
  $chart.appendChild($note)
}

function initKeydownListener(offset: number) {
  window.addEventListener('keydown', (event: KeyboardEvent) => {
    if (
      event.code === 'KeyJ' ||
      event.code === 'KeyK' ||
      event.code === 'KeyD' ||
      event.code === 'KeyF'
    ) {
      input = { ms: event.timeStamp - offset, code: event.code }
    }
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
