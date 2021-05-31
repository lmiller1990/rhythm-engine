import fs from 'fs'
import { readChart, toJsonChart } from '../src/smToJson'
import type { Measure } from '../src/smToJson'

const args = process.argv.slice(2)
const input = args[0]
const output = args[1]

const chart = readChart(input) as Measure[]

const asJson = toJsonChart({
  measures: chart,
  offset: -40,
  bpm: 175
})

const finalText = JSON.parse(JSON.stringify(asJson, null, 2))

try {
  fs.writeFileSync(output, `import type { Chart } from './src/engine'
export const chart: Chart = ${JSON.stringify(finalText)}`)
} catch (e) {
  console.log('Error', e)
}
