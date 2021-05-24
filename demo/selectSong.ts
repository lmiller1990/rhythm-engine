import {
  h,
  classModule,
  styleModule,
  propsModule,
  init,
  VNode,
  attributesModule
} from 'snabbdom'

const container = document.getElementById('select-song')!

const style = {
  songItemHeight: 20
}

const patch = init([classModule, propsModule, styleModule, attributesModule])

interface Song {
  id: string
  name: string
}

let songs: Song[] = Array(20)
  .fill(undefined)
  .map((x, idx) => ({
    id: (idx + 1).toString(),
    name: `Song ${idx + 1}`
  }))

let vnode: VNode

function renderSongs() {
  return songs.map((song) => {
    const index = songs.findIndex((x) => x.id === song.id)
    return h(
      'div',
      {
        key: song.id,
        class: { 'song-select-song': true },
        style: {
          top: `${index * style.songItemHeight}px`
        }
      },
      song.name
    )
  })
}

function createSongSelectRoot() {
  return h('div', { attrs: { id: 'select-song' } }, renderSongs())
}

export function createSongSelect() {
  vnode = createSongSelectRoot()
  patch(container, vnode)
}

function selectSong(direction: 'prev' | 'next') {
  songs = reorderList(songs, { direction })
  const newVnode = createSongSelectRoot()
  vnode = patch(vnode, newVnode)
}

document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (['ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault()
  }

  if (e.code === 'ArrowLeft') {
    selectSong('prev')
  }

  if (e.code === 'ArrowRight') {
    selectSong('next')
  }
})

export function reorderList<T>(
  list: T[],
  { direction }: { direction: 'next' | 'prev' }
) {
  const newList: T[] = []

  for (let i = 0; i < list.length; i++) {
    const next = direction === 'next' ? list[i + 1] : list[i - 1]

    if (next) {
      newList.push(next)
    } else {
      newList.push(list[list.length - i - 1])
    }
  }

  return newList
}
