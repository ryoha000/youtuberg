import * as c from './lib/canvas'
import { ConvertGray, ToBackgroundFromContent, ToContentFromBackground } from './lib/typing/message';
import { convertToGray } from './use/contentHandler';
try {
  const $video = c.getVideoElement()
  const $canvas = c.setupCanvas()
  setTimeout(() => {
    $video.pause()
    const videoRect = $video.getClientRects()
    $canvas.width = videoRect[0].width
    $canvas.height = videoRect[0].height
    const send = (type: Valueof<Pick<ToBackgroundFromContent, 'type'>>) => {
      return new Promise(resolve => {
        c.captureVideoToCanvas($video, $canvas)
        const ctx = $canvas.getContext('2d')
        if (!ctx) throw 'could not get ctx'
        const imgData = ctx.getImageData(0, 0, $canvas.width, $canvas.height)
        console.log('imgData', imgData)
        const buf = imgData.data.buffer
        const arr = Array.from(new Uint8Array(buf))
        if (imgData) {
          setTimeout(() => {
            const msg = { type, data: arr, width: $canvas.width, height: $canvas.height }
            console.log("send background", msg)
            postMessageToBackground(msg)
            resolve({})
          }, 1000);
        }
      })
    }
    send('enque').then(() => {
      $video.currentTime += 10
      $video.addEventListener('seeked', () => send('enque'), { once: true })
    })
  
    chrome.runtime.onMessage.addListener<ToContentFromBackground>((msg, sender, sendResponse) => {
      console.log('from background', msg)
      switch(msg.type) {
        case 'convertToGray':
          convertToGray($canvas)(msg);
          break
        default:
      }
      sendResponse()
      return true
    })
    const postMessageToBackground = (msg: ToBackgroundFromContent) => chrome.runtime.sendMessage(msg, () => {})
  }, 2000);
} catch (e) {
  console.warn(e)
}