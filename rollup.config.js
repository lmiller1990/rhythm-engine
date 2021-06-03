import ts from 'rollup-plugin-typescript2'
import pkg from './package.json'

function createEntry(options) {
  const config = {
    input: './src/index.ts',
    plugins: [
      ts({
        check: true,
        tsconfigOverride: {
          compilerOptions: {
            declaration: true,
            target: 'es5', // not sure what this should be?
            module: 'es2015'
          },
          include: ['src']
        }
      })
    ],
    output: {
      file: pkg.main
    }
  }

  return config
}


export default [
  createEntry({ format: 'cjs', input: 'src/index.ts', output: 'engine.cjs.js' }),
  createEntry({ format: 'esm', input: 'src/index.ts', output: 'engine.esm.js' }),
]
