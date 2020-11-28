import ts from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'

export default function createEntry() {
  const config = {
    input: './demo/demo.ts',
    plugins: [
      resolve(), 
      ts({
        clean: true,
        check: true,
        tsconfigOverride: {
          compilerOptions: {
            declaration: false,
            target: 'es5', // not sure what this should be?
            module: 'es2015'
          },
          exclude: ['tests']
        }
      })
    ],
    output: {
      file: './demo/demo.js'
    }
  }

  return config
}