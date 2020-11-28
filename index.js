const chart = [
  { id: 1, ms: 1000, code: 'KeyJ' },
  { id: 2, ms: 2000, code: 'KeyK' },
  { id: 3, ms: 3000, code: 'KeyJ' },
  { id: 4, ms: 4000, code: 'KeyK' },
  { id: 5, ms: 5000, code: 'KeyJ' },
  { id: 6, ms: 6000, code: 'KeyK' },
  { id: 7, ms: 7000, code: 'KeyJ' },
]

function visualize(chart) {
  const $chart = document.querySelector('#chart')
  for (const note of chart) {
    const el = document.createElement('div')
    el.setAttribute('data-noteid', note.id)
    el.innerText = `${note.ms} (${note.code})`
    $chart.append(el)
  }
}

export let initOffset = 0

const $elapsed = document.querySelector('#elapsed')
const $timing = document.querySelector('#timing')
let end = false

setTimeout(() => end = true, 10000 + initOffset)

let inputs = []

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyJ' || event.code === 'KeyK') {
    inputs.push({ timing: event.timeStamp - initOffset, code: event.code })
  }
})

function incrementMs(ms) {
  const nums = ms.toString().split('')
  if (nums.length < 4) {
    $elapsed.textContent = `0.${nums[0]}s`
  } else {
    $elapsed.textContent = `${nums[0]}.${nums[1]}s`
  }
}

export function nearest(input) {
  let best = chart[0]
  for (const note of chart) {
    if (input.code === note.code && Math.abs(note.ms - input.timing) < Math.abs(best.ms - input.timing)) {
      best = note
    }
  }
  return best
}

export function gameLoop(t0) {
  incrementMs(t0)

  const t1 = performance.now() - initOffset
  for (const n of vis) {
    const top = n.ms - t0
    if (top < -50) {
      n.el.style.display = "none"
      continue
    }

    n.el.style.top = `${top/10}px`
  }

  const input = inputs.length && inputs[0] 
  if (input) {
    const target = nearest(input)
    const diff = input.timing - target.ms 
    const note = document.querySelector(`[data-noteid="${target.id}"]`)

    if (diff > 0) {
      // early
      note.innerHTML += `${t1} <span class="lower">(+${diff})</span>`
    } else {
      // late
      note.innerHTML += `${t1} <span class="upper">(${diff})</span>`
    }
    inputs = []
  }

  if (end) {
    return
  }

  requestAnimationFrame(() => gameLoop(t1))
}

const createNote = tag => {
  const el = document.createElement(tag)
  el.className = 'note'
  return el
}

const vis = []
function drawInitialChart(chart) {
  const $chart = document.querySelector('#chart-notes')
  for (const note of chart) {
    const el = createNote('div')
    el.style.position = 'absolute'
    el.style.top = `${note.ms/10}px`
    vis.push({ ...note, el })
    $chart.appendChild(el)
  }
}

drawInitialChart(chart)

setTimeout(() => {
  const t0 = 0
  requestAnimationFrame(() => gameLoop(t0))
}, initOffset)

visualize(chart)
const seconds = {}
