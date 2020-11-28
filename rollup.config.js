import ts from 'rollup-plugin-typescript2'
import pkg from './package.json'

function createEntry(options) {
  const {
    format,
    input,
    isBrowser
  } = options

  const config = {
    input,
    plugins: [],
    output: {
      name: 'RhythmEngine',
      format,
    }
  }

  if (format === 'es') {
    config.output.file = pkg.module
    if (isBrowser) {
      config.output.file = pkg.browser
    }
  }

  console.log(`Building ${format}: ${config.output.file}`)

  config.plugins.push(
    ts({
      tsconfigOverride: {
        compilerOptions: {
          declaration: format === 'es',
          target: 'es5', // not sure what this should be?
          module: format === 'cjs' ? 'es2015' : 'esnext'
        },
        exclude: ['tests']
      }
    })
  )

  return config
}

export default [
  createEntry({ format: 'es', input: 'src/index.ts', isBrowser: false }),
  createEntry({ format: 'es', input: 'src/index.ts', isBrowser: true }),
]