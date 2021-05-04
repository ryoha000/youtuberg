import { CompareResultFeature, CompareResultHist, CompareResultPixel, Enque, ToBackgroundFromContent, ToBackgroundFromWebWorkerEvent, ToContentFromBackground, ToWebWorkerFromBackground } from "./lib/typing/message";

const workers: Worker[] = []
const WORKER_COUNT = Math.max(navigator.hardwareConcurrency - 1, 1)
for (let i = 0; i < WORKER_COUNT; i++) {
  const worker =  new Worker(chrome.runtime.getURL('worker.js'))
  worker.addEventListener('message', (ev: MessageEvent<ToBackgroundFromWebWorkerEvent>) => {
    const msg = ev.data;
    switch(msg.type) {
      case 'initialize':
        isInitialised = true
        break
      case 'convertToBinary':
        postMessageToContent(msg)
        break
      case 'compareHist':
        resHist.push(msg)
        break
      case 'comparePixel':
        // resPixel.push(msg)
        // あとで直す
        postMessageToContent(msg)
        break
      case 'compareFeature':
        resFeature.push(msg)
        break
      default:
        const _exhaustiveCheck: never = msg;
        break
    }
  });
  workers.push(worker)
}

let lastCuedIndex = -1
let isInitialised = false
let tabId = ''

const resHist: CompareResultHist[] = []
const resPixel: CompareResultPixel[] = []
const resFeature: CompareResultFeature[] = []
const postMessageToWebWorkers = (msg: ToWebWorkerFromBackground, index: number) => {
  console.log(`to webworker: ${index}`)
  workers[index].postMessage(msg)
}
const postMessageToContent = (msg: ToContentFromBackground) => chrome.tabs.sendMessage(tabId, msg, () => {})

chrome.runtime.onMessage.addListener<ToBackgroundFromContent>((msg, sender, sendResponse) => {
  tabId = sender.tab.id

  if (!isInitialised) {
    console.error('not initialized')
    sendResponse()
    return true
  }
  switch(msg.type) {
    case 'convertToBinary':
      if (msg.time !== 0) {
        postMessageToWebWorkers(msg, lastCuedIndex)
      }
      const nextIndex = workers.length <= lastCuedIndex + 1 ? 0 : lastCuedIndex + 1
      lastCuedIndex = nextIndex
      postMessageToWebWorkers(msg, nextIndex)
      break
    case 'enque':
      break
    case 'end':
      console.warn('end')
      for (let i = 0; i < workers.length; i++) {
        postMessageToWebWorkers({ type: 'end' }, i)
      }
      break
    default:
      const _exhaustiveCheck: never = msg;
      break
  }
  sendResponse()
  return true
})
