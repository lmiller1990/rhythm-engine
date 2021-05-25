import { reorderList } from '../demo/selectSong'

describe('reorderList', () => {
  it('reorders to next element', () => {
    // shift all elements to right. Loop around.
    const items: number[] = [1, 2, 3, 4, 5, 6]
    const actual = reorderList(items, { direction: 'next' })
    expect(actual).toEqual([2, 3, 4, 5, 6, 1])
  })

  it('reorders to prev element', () => {
    // shift all elements to left. Loop around.
    const items: number[] = [1, 2, 3, 4, 5, 6]
    const actual = reorderList(items, { direction: 'prev' })
    expect(actual).toEqual([6, 1, 2, 3, 4, 5])
  })
})
