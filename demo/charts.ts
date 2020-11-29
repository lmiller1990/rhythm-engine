import {
  Chart,
  createChart
} from '../dist'
import { Column } from './demo'

const chartOffset = 2150

export const uberRave: Chart<Column> = createChart({
  offset: chartOffset,
  notes: [
    { id: '1', ms: 0, code: '1' },
    { id: '2', ms: 334, code: '2' },
    { id: '3', ms: 713, code: '1'},
    { id: '4', ms: 1029, code: '2' },
    { id: '5', ms: 1029, code: '1' },
  ]
})

const bpm = 175

export const chart: Chart = createChart({
  offset: chartOffset,
  notes: new Array(30).fill(0).map((_, idx) => {
    const ms = Math.round((1000 / (bpm / 60)) * idx)
    return {
      id: (idx + 1).toString(),
      ms,
      code: '1'
    }
  })
})
