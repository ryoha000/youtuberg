importScripts('wasm-util.js', 'module.js', 'build/cv-wasm.js');

addEventListener('message', (ev) => {
  const meta = ev.data;
  switch (meta.type) {
    case 'req_match':
      new cv.Mat()
      break;
    default:
  }
});

Module.onInit(() => {
  postMessage({ type: 'init' });
});

