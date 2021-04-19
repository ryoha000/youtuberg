import { CompareResultHist, CompareResultPixel, Enque, ToBackgroundFromContent, ToBackgroundFromWebWorkerEvent, ToContentFromBackground, ToWebWorkerFromBackground } from "./lib/typing/message";

const worker = new Worker(chrome.runtime.getURL('worker.js'));
let isInitialised = false
let tabId = ''
const imgs: Enque[] = []
const resHist: CompareResultHist[] = []
const resPixel: CompareResultPixel[] = []
const postMessageToWebWorker = (msg: ToWebWorkerFromBackground) => worker.postMessage(msg)
const postMessageToContent = (msg: ToContentFromBackground) => chrome.tabs.sendMessage(tabId, msg, () => {})


worker.addEventListener('message', (ev: MessageEvent<ToBackgroundFromWebWorkerEvent>) => {
  const msg = ev.data;
  console.log('from webworker')
  switch(msg.type) {
    case 'initialize':
      isInitialised = true
      break
    case 'convertToGray':
      postMessageToContent(msg)
      break
    case 'compareHist':
      resHist.push(msg)
      break
    case 'comparePixel':
      resPixel.push(msg)
      break
  }
});

chrome.runtime.onMessage.addListener<ToBackgroundFromContent>((msg, sender, sendResponse) => {
  console.log('from contentscript')
  tabId = sender.tab.id
  if (!isInitialised) {
    console.error('not initialized')
    sendResponse()
    return true
  }
  switch(msg.type) {
    case 'convertToGray':
      postMessageToWebWorker(msg)
      break
    case 'enque':
      imgs.push(msg)
      if (imgs.length === 2) {
        postMessageToWebWorker({ type: 'compare', img1: imgs[0], img2: imgs[1] })
        imgs.pop()
      }
      break
    case 'end':
      console.log('end')
      setTimeout(() => {
        console.log(resHist)
        console.log(resPixel)
      }, 2000);
      break
    default:
  }
  sendResponse()
  return true
})
