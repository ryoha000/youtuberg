const copyWasm = async () => {
  const path = require('path')
  const fs = require('fs/promises')
  const wasmName = 'youtuberg_wasm_bg.wasm'
  const wasmOriginalPath = path.join(__dirname, './node_modules/@ryoha/youtuberg-wasm', wasmName)
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
    entryPoints: ['src/content_script.ts', 'src/background.ts', 'src/worker.ts'],
    bundle: true,
    outdir: 'public',
    loader: { '.png': 'dataurl' },
    watch: !isProduction,
    minify: isProduction
  }).catch(() => process.exit(1))
})
