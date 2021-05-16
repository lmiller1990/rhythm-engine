import { Chart, createChart } from '../dist'
import { Column } from './demo'

const songOffset = 33
// const machine = 100
// const chartOffset = 2100 + songOffset + machine

export const uberRave: Chart<Column> = createChart({
  // offset: chartOffset,
  offset: songOffset,
  notes: [
    { id: '1', ms: 0, code: '1' },
    { id: '2', ms: 342, code: '2' },
    { id: '3', ms: 684, code: '1' },
    { id: '4', ms: 1026, code: '2' },
    { id: '5', ms: 1026, code: '1' },
    { id: '6', ms: 1368, code: '1' },
    { id: '7', ms: 1710, code: '2' },
    { id: '8', ms: 2052, code: '3' },
    { id: '9', ms: 2394, code: '4' },
    { id: '10', ms: 2394, code: '3' },
    { id: '11', ms: 2736, code: '2' },
    { id: '12', ms: 3078, code: '1' },
    { id: '13', ms: 3420, code: '4' },
    { id: '14', ms: 3762, code: '1' }
  ]
})

const bpm = 175

// export const chart: Chart = createChart({
//   offset: chartOffset,
//   notes: new Array(30).fill(0).map((_, idx) => {
//     const ms = Math.round((1000 / (bpm / 60)) * idx)
//     return {
//       id: (idx + 1).toString(),
//       ms,
//       code: '1'
//     }
//   })
// })
