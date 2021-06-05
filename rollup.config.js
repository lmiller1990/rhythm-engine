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
      file: options.format === 'cjs' ? pkg.main : pkg.module,
      format: options.format
    }
  }

  return config
}


export default [
  createEntry({ format: 'cjs', output: 'engine.cjs.js' }),
  createEntry({ format: 'esm', output: 'engine.esm.js' }),
]
