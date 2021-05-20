import { ToBackgroundFromWebWorkerEvent, ToPageFromWebWorker, ToWebWorkerFromBackground, ToWebWorkerFromPage } from "./lib/typing/message";
import { default as _wasm } from '../node_modules/youtuberg-wasm/youtuberg_wasm_bg.wasm'
import init, { get_labels_by_gray } from "youtuberg-wasm";

console.log('load worker')
init(_wasm).then(() => {
  postMessageToPage({ type: 'initialize' })
})

const labels: Uint32Array[] = []
addEventListener('message', (ev: MessageEvent<ToWebWorkerFromPage>) => {
  const msg = ev.data;
  switch (msg.type) {
    case 'enque':
      const label = get_labels_by_gray(new Uint8Array(msg.data), msg.width, msg.height, msg.side)
      labels.push(label)
      if (labels.length === 2) {
        if (labels[0].length !== labels[1].length) {
          postMessageToPage({ type: 'compareResult', time: msg.time, result: 0 })
          labels.splice(0, 2)
        } else {
          const d = compareGroup(labels[0], labels[1])
          postMessageToPage({ type: 'compareResult', time: msg.time, result: d })
          labels.splice(0, 2)
        }
      }
      break
    case 'end':
      labels.splice(0, 2)
      break
    default:
      const _exhaustiveCheck: never = msg;
  }
});

const postMessageToPage = (msg: ToPageFromWebWorker) => postMessage(msg)

const compareGroup = (label1: Uint32Array, label2: Uint32Array) => {
  if (label1.length !== label2.length) {
    throw 'not match length'
  }
  const newLabel: number[] = []
  for (let i = 0; i < label1.length; i++) {
    if ((label1[i] === 1 || label2[i] === 0) && (label1[i] !== 0 || label2[i] !== 0)) {
      newLabel.push(1)
    } else {
      newLabel.push(0)
    }
  }
  return newLabel.filter(v => v === 1).length 
}
