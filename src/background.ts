const worker = new Worker(chrome.runtime.getURL('worker.js'));
worker.addEventListener('message', (ev) => {
  const meta = ev.data;
  switch (meta.type) {
    case 'init':
      console.log('init')
      worker.postMessage({ type: 'req_match' });
      console.log('send req_match')
      break;
    case 'res_match':
      console.log('res_match')
    default:
  }
});
