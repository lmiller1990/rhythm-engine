const chart = [
  { id: 1, ms: 500, key: 'j' },
  { id: 2, ms: 1000, key: 'k' },
  { id: 3, ms: 2000, key: 'k' },
  { id: 4, ms: 2500, key: 'k' },
  { id: 5, ms: 3500, key: 'k' },
  { id: 6, ms: 4000, key: 'k' },
  { id: 7, ms: 5500, key: 'k' },
]

function visualize(chart) {
  const $chart = document.querySelector('#chart')
  for (const note of chart) {
    const el = document.createElement('div')
    el.setAttribute('data-noteid', note.id)
    el.innerText = `${note.ms} (${note.key})`
    $chart.append(el)
  }
}

export let initOffset = 0

const $elapsed = document.querySelector('#elapsed')
const $timing = document.querySelector('#timing')
let end = false

setTimeout(() => end = true, 10000 + initOffset)

let inputs = []

function log({ timing, threshold }) {
  const el = document.createElement('div')
  const symbol = threshold === 'upper' ? '+' : '-'
  el.innerText = `${symbol}${timing}`
  el.className = threshold
  $timing.append(el)
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyJ' || event.code === 'KeyK') {
    inputs.push(event.timeStamp - initOffset)
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

export function nearest(ms) {
  let best = chart[0]
  for (const note of chart) {
    if (Math.abs(note.ms - ms) < Math.abs(best.ms - ms)) {
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

  const timing = inputs.length && inputs[0] 
  if (timing) {
    const target = nearest(t1)
    const diff = t1 - target.ms 
    const note = document.querySelector(`[data-noteid="${target.id}"]`)

    if (diff > 0) {
      // early
      note.innerHTML += `${t1} <span class="lower">(+${diff})</span>`
    } else {
      // late
      note.innerHTML += `${t1} <span class="upper">(${diff})</span>`
    }
    inputs = []
    console.log(t0, target)
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
