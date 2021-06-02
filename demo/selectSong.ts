import {
  h,
  classModule,
  styleModule,
  propsModule,
  init,
  VNode,
  attributesModule
} from 'snabbdom'
import { initGameplayElements, initializeGameplayEvents } from './gameplay'

const style = {
  songItemHeight: 30
}

export interface Song {
  id: string
  name: string
  src: string
}

export const uberRaveSong = { id: '6', name: 'Uber Rave', src: 'uber-rave.mp3' }

let songs: Song[] = [
  // TODO: have more songs!
  // { id: '1', name: 'Xepher', src: 'xepher.ogg' },
  // { id: '2', name: 'Red Zone', src: 'red_zone.ogg' },
  // { id: '3', name: 'Himawari', src: 'himawari.ogg' },
  // { id: '4', name: 'DoLL', src: 'doll.ogg' },
  // { id: '5', name: 'AA', src: 'AA.ogg' },
  { ...uberRaveSong, id: '1'  },
  { ...uberRaveSong, id: '2'  },
  { ...uberRaveSong, id: '3'  },
  { ...uberRaveSong, id: '4'  },
  { ...uberRaveSong, id: '5'  },
  uberRaveSong
]

let vnode: VNode
let selectedSongId: string

function renderSongs() {
  return songs.map((song) => {
    const index = songs.findIndex((x) => x.id === song.id)

    return h(
      'div',
      {
        key: song.id,
        class: {
          'song-select-song': true,
          'song-select-selected': song.id === selectedSongId
        },
        style: {
          top: `${index * style.songItemHeight}px`
        }
      },
      song.name
    )
  })
}

function createSongSelectRoot() {
  selectedSongId = songs[songs.length / 2].id
  return h('div', { attrs: { id: 'select-song' } }, renderSongs())
}

const patch = init([classModule, propsModule, styleModule, attributesModule])

export function createSongSelect() {
  const $selectSong = document.createElement('div')
  $selectSong.id = 'select-song'
  document.body.insertAdjacentElement('beforeend', $selectSong)
  vnode = createSongSelectRoot()
  patch($selectSong, vnode)
}

function selectSong(direction: 'prev' | 'next') {
  songs = reorderList(songs, { direction })
  selectedSongId = songs[songs.length / 2].id
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

  if (e.code === 'Enter') {
    const song = songs.find((x) => x.id === selectedSongId)
    if (!song) {
      throw Error(
        `Could not find selected song by id: ${selectedSongId}. This should never happen.`
      )
    }

    initGameplayElements()
    initializeGameplayEvents(song)
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
