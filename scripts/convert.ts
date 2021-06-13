/**
 * Convert a StepMania-like chart to a JSON style one used
 * by this engine.
 * 
 * Usage:
 * 
 * yarn ts-node scripts/convert.ts [input] [output]
 * yarn ts-node scripts/convert.ts ./scripts/input.txt output.ts
 * 
 * input is a StepMania-like chart:
 * 
 * 0000
 * 1000
 * 0001
 * 0010
 * ,
 * 0000
 * 0000
 * 0000
 * 1000
 * 
 * etc.
 */
import fs from 'fs'
import { readChart, toJsonChart } from '../src/smToJson'
import type { Measure } from '../src/smToJson'

const args = process.argv.slice(2)
const input = args[0]
const output = args[1]

const chart = readChart(input) as Measure[]

const asJson = toJsonChart({
  measures: chart,
  offset: 0,
  bpm: 175
})

const finalText = JSON.parse(JSON.stringify(asJson, null, 2))

try {
  fs.writeFileSync(output, `import type { Chart } from './src/engine'
export const chart: Chart = ${JSON.stringify(finalText)}`)
} catch (e) {
  console.log('Error', e)
}
