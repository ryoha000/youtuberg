let wasmPlugin = {
  name: 'wasm',
  setup(build) {
    let path = require('path')
    let fs = require('fs')

    // Resolve ".wasm" files to a path with a namespace
    build.onResolve({ filter: /\.wasm$/ }, args => {
      if (args.resolveDir === '') {
        return // Ignore unresolvable paths
      }
      return {
        path: path.isAbsolute(args.path) ? args.path : path.join(args.resolveDir, args.path),
          namespace: 'wasm-binary',
      }
    })

    // Virtual modules in the "wasm-binary" namespace contain the
    // actual bytes of the WebAssembly file. This uses esbuild's
    // built-in "binary" loader instead of manually embedding the
    // binary data inside JavaScript code ourselves.
    build.onLoad({ filter: /.*/, namespace: 'wasm-binary' }, async (args) => ({
      contents: await fs.promises.readFile(args.path),
      loader: 'binary',
    }))
  },
}

const isProduction = !!Number(process.env.PRODUCTION)
require('esbuild').build({
  entryPoints: ['src/content_script.ts', 'src/patch-worker.js', 'src/worker.ts', 'src/background.ts', 'src/popup.ts'],
  bundle: true,
  outdir: 'public',
  loader: { '.png': 'dataurl' },
  watch: !isProduction,
  minify: isProduction,
  plugins: [wasmPlugin]
}).catch(() => process.exit(1))
