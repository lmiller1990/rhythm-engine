import {
  Chart,
  updateGameState,
  GameChart,
  initGameState,
  GameNote,
  Input
} from '../dist'

const chart: Chart = {
  notes: [
    { id: '1', ms: 1000, code: 'KeyJ' },
    { id: '2', ms: 2000, code: 'KeyK' },
    { id: '3', ms: 3000, code: 'KeyJ' },
    { id: '4', ms: 4000, code: 'KeyK' },
    { id: '5', ms: 5000, code: 'KeyJ' },
    { id: '6', ms: 6000, code: 'KeyK' },
    { id: '7', ms: 7000, code: 'KeyJ' }
  ]
}

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

function updateDebug(world: UIWorld) {
  const $body = document.querySelector('#debug-body')!
  $body.innerHTML = ''

  for (const note of world.state.chart.notes) {
    const $tr = document.createElement('tr')
    for (const attr of ['id', 'ms', 'code', 'canHit', 'hitAt', 'hitTiming']) {
      const $td = document.createElement('td')
      // @ts-ignore
      $td.innerText = note[attr]
      $tr.append($td)
    }
    $body.append($tr)
  }
}

let input: Input | undefined

export function gameLoop(world: UIWorld) {
  const newGameState = updateGameState({
    time: world.core.time,
    chart: world.core.chart,
    input
  })

  for (const note of newGameState.notes) {
    const yPos = world.shell.notes[note.id].ms - world.core.ms
    world.shell.notes[note.id].$el.style.top = `${yPos / 10}px`
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
  $note.style.top = `${Math.round(note.ms / 10)}px`
  notes[note.id] = {
    ...note,
    $el: $note
  }
  $chart.appendChild($note)
}

function initKeydownListener(offset: number) {
  window.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.code === 'KeyJ' || event.code === 'KeyK') {
      input = { ms: event.timeStamp - offset, code: event.code }
    }
  })
}

document.querySelector('#start')!.addEventListener('click', () => {
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
