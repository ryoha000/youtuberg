import * as c from './lib/canvas'
import { ToBackgroundFromContent, ToContentFromBackground } from './lib/typing/message';
import { convertToBinary } from './use/contentHandler';

try {
  const $video = c.getVideoElement()
  const $canvas = c.setupCanvas()
  let time = 0
  // TODO: meteadataのloadとかでしっかりとる
  const videoRect = $video.getClientRects()
  $canvas.width = videoRect[0].width
  $canvas.height = videoRect[0].height
  const TIME_SECOND = 1

  setTimeout(async () => {
    $video.pause()
    $video.currentTime = 0
    $canvas.getContext('2d')!.filter = 'contrast(100000000000000000000000000%) grayscale(1)'

    const duration = $video.duration
    const sleep = (msec: number) => new Promise(resolve => setTimeout(resolve, msec))
    for (let i = 0; i < duration / TIME_SECOND; i++) {
      const seekPromise = new Promise(resolve => {
        $video.addEventListener('seeked', resolve, { once: true })
      })
      try {
        const data = c.captureVideoToCanvas($video, $canvas)
        send('convertToBinary', data)
        time += TIME_SECOND
        await sleep(2000)
        $video.currentTime += TIME_SECOND
        await seekPromise
      } catch {}
    }

    setTimeout(() => {
      postMessageToBackground({ type: 'end' })
      console.log('end')
    }, 1000);
  }, 2000);
  const send = (type: Valueof<Pick<ToBackgroundFromContent, 'type'>>, data: number[]) => {
    return new Promise((resolve) => {
      const msg = { type, time, data, width: $canvas.width, height: $canvas.height }
      console.log("send background")
      postMessageToBackground(msg)
      resolve({})
    })
  }

  chrome.runtime.onMessage.addListener<ToContentFromBackground>((msg, _, sendResponse) => {
    switch(msg.type) {
      case 'convertToBinary':
        convertToBinary($canvas)(msg);
        c.laplacianFilter($canvas)
        break
      case 'compareResult':
        break
      default:
        const _exhaustiveCheck: never = msg
    }
    sendResponse()
    return true
  })
  const postMessageToBackground = (msg: ToBackgroundFromContent) => chrome.runtime.sendMessage(msg, () => {})
} catch (e) {
  console.warn(e)
}