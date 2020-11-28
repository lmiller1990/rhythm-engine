import { fromEvent } from 'rxjs'
import { map } from 'rxjs/operators'
import { judge, nearestNote, Chart, prettyTimeElapsed } from '../dist'

const chart: Chart = {
  notes: [
    { id: '1', ms: 1000, code: 'KeyJ' },
    { id: '2', ms: 2000, code: 'KeyK' },
    { id: '3', ms: 3000, code: 'KeyJ' },
    { id: '4', ms: 4000, code: 'KeyK' },
    { id: '5', ms: 5000, code: 'KeyJ' },
    { id: '6', ms: 6000, code: 'KeyK' },
    { id: '7', ms: 7000, code: 'KeyJ' },
  ]
}

const $elapsed = document.querySelector('#elapsed')!

function visualize(chart: Chart) {
  const $chart = document.querySelector('#chart')!
  for (const note of chart.notes) {
    const $note = document.createElement('div')
    $note.className = 'note__name'
    $note.innerText = `${note.ms} (${note.code})`

    const $el = document.createElement('div')
    $el.className = 'note'
    $el.setAttribute('data-noteid', note.id)
    $el.append($note)
    $chart.append($el)
  }
}

const initOffset = 0
let end = false

setTimeout(() => end = true, 10000 + initOffset)

fromEvent<KeyboardEvent>(window, 'keydown')
  .pipe(
    map(event => {
      return {
        code: event.code, ms: event.timeStamp
      }
    })
  ).subscribe(input => {
    const note = nearestNote(input, chart)
    if (!note) {
      return
    }

    const timing = judge(input, note)
    const $note = document.querySelector(`[data-noteid="${note.id}"]`)!

    // early
    if (timing > 0) {
      $note.innerHTML += `<div class="note__timing">${input.ms} <span class="note__timing--lower">(+${timing})</span></div>`
    } else {
      // late
      $note.innerHTML += `<div class="note__timing">${input.ms} <span class="note__timing--upper">(${timing})</span></div>`
    }
  })

export function gameLoop(ms: number) {
  $elapsed.textContent = prettyTimeElapsed(ms)

  if (end) {
    return
  }
  const nextMs = performance.now() - initOffset
  requestAnimationFrame(() => gameLoop(nextMs))
}

visualize(chart)

setTimeout(() => {
  requestAnimationFrame(() => gameLoop(0))
}, initOffset)