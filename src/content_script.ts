import * as c from './lib/canvas'
import { ToBackgroundFromContent, ToContentFromBackground } from './lib/typing/message';
import { convertToGray } from './use/contentHandler';

try {
  const tag = `
  <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="0%" height="0%" id="sharpenSVG">
    <filter id="Sharpen">
      <feConvolveMatrix order="3 3" preserveAlpha="true" kernelMatrix="0 -10000 0 -10000 100000 -10000 0 -10000 0"></feConvolveMatrix>
    </filter>
  </svg>
  `
  const dom = (new DOMParser().parseFromString(tag, 'text/html')).getElementById('sharpenSVG')!
  document.body.appendChild(dom)
  const $video = c.getVideoElement()
  const $canvas = c.setupCanvas()
  let time = 0
  const videoRect = $video.getClientRects()
  $canvas.width = videoRect[0].width
  $canvas.height = videoRect[0].height
  const TIME_SECOND = 1

  setTimeout(async () => {
    $video.pause()
    $video.currentTime = 0
    $canvas.getContext('2d')!.filter = 'contrast(100000000000000000000000000%) grayscale(1)'

    // const data = c.captureVideoToCanvas($video, $canvas)
    // send('convertToGray', data)
    // c.sharping($canvas)
    // c.laplacianFilter($canvas)

    // setup($canvas)
    // c.laplacianFilter($canvas)

    const duration = $video.duration
    const sleep = (msec: number) => new Promise(resolve => setTimeout(resolve, msec))
    for (let i = 0; i < duration / TIME_SECOND; i++) {
      // await send('enque')
      const seekPromise = new Promise(resolve => {
        $video.addEventListener('seeked', resolve, { once: true })
      })
      try {
        const data = c.captureVideoToCanvas($video, $canvas)
        console.log('filter shown')
        // const data = c.sharping($canvas)
        // await sleep(500)
        // const data = c.laplacianFilter($canvas)
        send('convertToGray', data)
        time += TIME_SECOND
        $video.currentTime += TIME_SECOND
        await sleep(2000)
        await seekPromise
      } catch {

      }
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
      // c.captureVideoToCanvas($video, $canvas)
      // const ctx = $canvas.getContext('2d')
      // if (!ctx) throw 'could not get ctx'
      // const imgData = ctx.getImageData(0, 0, $canvas.width, $canvas.height)
      // const buf = imgData.data.buffer
      // const arr = Array.from(new Uint8Array(buf))
      // if (imgData) {
      //   const msg = { type, time, data: arr, width: $canvas.width, height: $canvas.height }
      //   console.log("send background")
      //   postMessageToBackground(msg)
      // }
      // resolve({})
    })
  }

  chrome.runtime.onMessage.addListener<ToContentFromBackground>((msg, sender, sendResponse) => {
    // console.log('from background', msg)
    switch(msg.type) {
      case 'convertToGray':
        console.log('binary come')

        convertToGray($canvas)(msg);
        c.laplacianFilter($canvas)
        // c.sharping($canvas)
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