import { uberRaveSong } from './selectSong'
import { initInterface, initGameplayElements } from './gameplay'

export function createEditor() {
  const $el = document.createElement('div')
  $el.id = 'editor'
  document.body.insertAdjacentElement('beforeend', $el)

  initGameplayElements()
  initInterface($el)
}
