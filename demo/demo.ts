import { fromEvent } from 'rxjs'
import { map } from 'rxjs/operators'
import { judge, nearestNote, Chart, prettyTimeElapsed, Note, updateGameState, GameChart, initGameState, GameNote, Input } from '../dist'

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


// function drawDebug(chart: Chart) {
//   const $chart = document.querySelector('#chart')!
//   for (const note of chart.notes) {
//     const $note = document.createElement('div')
//     $note.className = 'note__name'
//     $note.innerText = `${note.ms} (${note.code})`

//     const $el = document.createElement('div')
//     $el.className = 'note'
//     $el.setAttribute('data-noteid', note.id)
//     $el.append($note)
//     $chart.append($el)
//   }
// }

const initOffset = 0
let end = false

setTimeout(() => (end = true), 10000 + initOffset)

// fromEvent<KeyboardEvent>(window, 'keydown')
//   .pipe(
//     map((event) => {
//       return {
//         code: event.code,
//         ms: event.timeStamp
//       }
//     })
//   )
//   .subscribe((input) => {
//     const note = nearestNote(input, chart)
//     if (!note) {
//       return
//     }

//     const timing = judge(input, note)
//     const $note = document.querySelector(`[data-noteid="${note.id}"]`)!

//     // early
//     if (timing > 0) {
//       $note.innerHTML += `<div class="note__timing">${input.ms} <span class="note__timing--lower">(+${timing})</span></div>`
//     } else {
//       // late
//       $note.innerHTML += `<div class="note__timing">${input.ms} <span class="note__timing--upper">(${timing})</span></div>`
//     }
//   })

interface UIWorld {
  state: {
    ms: number
    chart: GameChart
  }
  notes: Record<string, UINote>
}


function updateDebug(world: UIWorld) {
  const $head = document.querySelector('#debug-head')!
  $head.innerHTML = ''

  for (const k of Object.keys(world.state.chart.notes[0])) {
    const $th = document.createElement('th')
    $th.innerText = k
    $head.appendChild($th)
  }

  const $body = document.querySelector('#debug-body')!
  $body.innerHTML = ''

  for (const note of world.state.chart.notes) {
    const $tr = document.createElement('tr')
    for (const v of Object.values(note)) {
      const $td = document.createElement('td')
      $td.innerText = v
      $tr.append($td)
    }
    $body.append($tr)
  }
}

let input: Input | undefined

window.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.code === 'KeyJ' || event.code === 'KeyK') {
    input = { ms: event.timeStamp - initOffset, code: event.code }
  }
})

export function gameLoop(world: UIWorld) {
  // $elapsed.textContent = prettyTimeElapsed(world.state.ms)

  const newGameState = updateGameState({
    ms: world.state.ms,
    chart: world.state.chart,
    input
  })

  for (const note of newGameState.notes) {
    const yPos = world.notes[note.id].ms - world.state.ms
    world.notes[note.id].$el.style.top = `${yPos / 10}px`
  }

  const newWorld: UIWorld = {
    state: {
      ms: performance.now() - initOffset,
      chart: newGameState
    },
    notes: world.notes
  }

  if (input) {
    updateDebug(newWorld)
    console.log(world.state.chart.notes, newGameState.notes)
  }


  input = undefined

  if (end) {
    return
  }

  requestAnimationFrame(() => gameLoop(newWorld))
}

// drawDebug(chart)
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

setTimeout(() => {
  const world: UIWorld = {
    state: {
      ms: 0,
      chart: gameChart
    },
    notes
  }
  updateDebug(world)

  requestAnimationFrame(() => gameLoop(world))
}, initOffset)
