import { Chart, createChart } from '../dist'
import { Column } from './demo'

const chartOffset = 2150

export const uberRave: Chart<Column> = createChart({
  offset: chartOffset,
  notes: [
    { id: '1', ms: 0, code: '1' },
    { id: '2', ms: 342, code: '2' },
    { id: '3', ms: 684, code: '1' },
    { id: '4', ms: 1026, code: '2' },
    { id: '5', ms: 1026, code: '1' },
    { id: '6', ms: 1368, code: '1', dependsOn: '5' },
    { id: '7', ms: 1710, code: '2', dependsOn: '6' },
    { id: '8', ms: 2052, code: '3', dependsOn: '7' },
    { id: '9', ms: 2394, code: '4', dependsOn: '8' }
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
