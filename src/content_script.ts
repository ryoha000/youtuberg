import * as c from './lib/canvas'
import { ToBackgroundFromContent, ToContentFromBackground } from './lib/typing/message';
import { convertToGray } from './use/contentHandler';
try {
  const $video = c.getVideoElement()
  const $canvas = c.setupCanvas()
  let time = 0
  const TIME_SECOND = 0.1
  setTimeout(async () => {
    $video.pause()
    const videoRect = $video.getClientRects()
    $canvas.width = videoRect[0].width
    $canvas.height = videoRect[0].height
    $video.currentTime = 0

    const duration = $video.duration
    for (let i = 0; i < duration / TIME_SECOND; i++) {
      await send('enque')
      const seekPromise = new Promise(resolve => {
        $video.addEventListener('seeked', resolve, { once: true })
      })
      time += TIME_SECOND
      $video.currentTime += TIME_SECOND
      await seekPromise
    }
    setTimeout(() => {
      postMessageToBackground({ type: 'end' })
      console.log('end')
    }, 1000);
  }, 2000);
  const send = (type: Valueof<Pick<ToBackgroundFromContent, 'type'>>) => {
    return new Promise((resolve) => {
      c.captureVideoToCanvas($video, $canvas)
      const ctx = $canvas.getContext('2d')
      if (!ctx) throw 'could not get ctx'
      const imgData = ctx.getImageData(0, 0, $canvas.width, $canvas.height)
      const buf = imgData.data.buffer
      const arr = Array.from(new Uint8Array(buf))
      if (imgData) {
        const msg = { type, time, data: arr, width: $canvas.width, height: $canvas.height }
        console.log("send background")
        postMessageToBackground(msg)
        resolve({})
        // setTimeout(() => {
        // }, 1000);
      }
    })
    // return new Promise(resolve => {
    // })
  }
  const aaa = () => {

  }

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
} catch (e) {
  console.warn(e)
}