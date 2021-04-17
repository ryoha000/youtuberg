import { Handler, ToBackgroundFromContent, ToBackgroundFromWebWorkerEvent, ToContentFromBackground, ToWebWorkerFromBackground } from "./lib/typing/message";

const worker = new Worker(chrome.runtime.getURL('worker.js'));
let isInitialised = false
let tabId = ''
const postMessageToWebWorker = (msg: ToWebWorkerFromBackground) => worker.postMessage(msg)
const postMessageToContent = (msg: ToContentFromBackground) => chrome.tabs.sendMessage(tabId, msg, () => {})

worker.addEventListener('message', (ev: MessageEvent<ToBackgroundFromWebWorkerEvent>) => {
  const meta = ev.data;
  console.log('from webworker', meta)
  switch (meta.type) {
    case 'initialize':
      console.log('initialize')
      isInitialised = true
      worker.postMessage({ type: 'req_match' });
      console.log('send req_match')
      break;
    case 'convertToGray':
      console.log("response img by worker")
      postMessageToContent(meta)
      break
    default:
      console.log('worker message')
  }
});

const toContetScriptHandler: Handler<ToBackgroundFromContent> = {
  'convertToGray': (msg) => postMessageToWebWorker(msg)
}
chrome.runtime.onMessage.addListener<ToBackgroundFromContent>((msg, sender, sendResponse) => {
  console.log('from contentscript', msg)
  tabId = sender.tab.id
  if (!isInitialised) {
    sendResponse()
    return true
  }
  console.log(toContetScriptHandler)
  console.log(toContetScriptHandler[msg.type])
  toContetScriptHandler[msg.type](msg)
  sendResponse()
  return true
})
