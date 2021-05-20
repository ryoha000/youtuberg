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

const copyWasm = async () => {
  const path = require('path')
  const fs = require('fs/promises')
  const wasmName = 'youtuberg_wasm_bg.wasm'
  const wasmOriginalPath = path.join(__dirname, './node_modules/youtuberg-wasm', wasmName)
  const wasmPublicPath = path.join(__dirname, './public', wasmName)
  try {
    await fs.unlink(wasmPublicPath)
  } catch {}
  try {
    fs.copyFile(wasmOriginalPath, wasmPublicPath)
  } catch (e) {
    console.error(e)
    console.error('please run "npm install"')
  }
}

copyWasm().then(_ => {
  const isProduction = !!Number(process.env.PRODUCTION)
  require('esbuild').build({
    entryPoints: ['src/content_script.ts', 'src/patch-worker.js', 'src/worker.ts', 'src/background.ts'],
    bundle: true,
    outdir: 'public',
    loader: { '.png': 'dataurl' },
    watch: !isProduction,
    minify: isProduction,
    plugins: [wasmPlugin]
  }).catch(() => process.exit(1))
})
