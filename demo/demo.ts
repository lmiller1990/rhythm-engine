import {
  updateGameState,
  GameChart,
  initGameState,
  GameNote,
  Input,
  EngineConfiguration
} from '../dist'
import { uberRave } from './charts'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'


const LANE_WIDTH = 1
const LANE_DEPTH = 12

function createLane() {
  const geometry = new THREE.BoxGeometry(LANE_WIDTH, 0.1, LANE_DEPTH)
  const material = new THREE.MeshLambertMaterial({ color: 0xdbbbc7 })
  const mesh = new THREE.Mesh(geometry, material)
  return mesh
}

function corners(mesh: THREE.Mesh) {
  const halfWidth = LANE_WIDTH * 0.5
  return {
    x0: mesh.position.x - halfWidth,
    x1: mesh.position.x + halfWidth,
    z0: mesh.position.z,
    z1: mesh.position.z + LANE_DEPTH,
  }
}

function init() {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 20)
  camera.position.set(0, 4, -10)

  const light = new THREE.DirectionalLight(0xFFFFFF, 1)
  light.position.set(1, 10, 6)
  scene.add(light)

  const ambient = new THREE.HemisphereLight(0xffffbb, 0x080820);
  scene.add(ambient);

  const renderer = new THREE.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  let offset = -1.5
  for (let i = 0; i < 1; i++) {
    const lane = createLane()
    lane.position.set(0, 0, 0)
    console.log(corners(lane))
    // scene.add(lane)
  }

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0,4,0)
  controls.update()

  update({ scene, camera, renderer })
  return { scene, camera, renderer }
}

const { scene, camera, renderer } = init()

interface Update {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
}

function update({ scene, camera, renderer }: Update) {
  requestAnimationFrame(() => update({ scene, camera, renderer }));
	renderer.render(scene, camera);
}

const ctx = document.createElement('canvas')
document.body.appendChild(ctx)

interface UINote<T> extends GameNote {
  $el: T
}

let end = false

setTimeout(() => (end = true), 20000)

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
  maxHitWindow: 100
}

interface UIWorld {
  core: {
    time: number
    chart: GameChart
    offset: number
  }
  shell: {
    notes: Record<string, UINote<THREE.Mesh>>
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

  const newGameState = updateGameState(
    {
      time,
      chart: world.core.chart,
      inputs
    },
    config
  )

  for (const note of newGameState.notes) {
    const yPos = world.shell.notes[note.id].ms - world.core.time
    world.shell.notes[note.id].$el.position.z = yPos / SPACING
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

const notes: Record<string, UINote<THREE.Mesh>> = {}

const $chart = document.querySelector('#chart-notes')!

const SPACING = 500
let i = 0

for (const note of gameChart.notes) {

  // const $note = document.createElement('div')
  // $note.className = 'ui-note'
  // $note.style.top = `${Math.round(note.ms / SPEED_MOD)}px`
  // $note.style.left = `${(parseInt(note.code) - 1) * 25}px`

  const box = new THREE.BoxGeometry(LANE_WIDTH, 0.1, 0.3)
  const material = new THREE.MeshLambertMaterial({ color: 0xABCDEF })
  const $note = new THREE.Mesh(box, material)
  $note.position.set(-parseInt(note.code), 0, note.ms / SPACING)
  scene.add($note)

  notes[note.id] = {
    ...note,
    $el: $note
  }
  // $chart.appendChild($note)
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
  // updateDebug(world)

  requestAnimationFrame(() => gameLoop(world))
})
