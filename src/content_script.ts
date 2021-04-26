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
    $canvas.getContext('2d')!.filter = 'contrast(100000000000000000000000000%) grayscale(1)'

    // c.captureVideoToCanvas($video, $canvas)
    // c.sharping($canvas)
    // c.laplacianFilter($canvas)

    // setup($canvas)
    // c.laplacianFilter($canvas)

    // $video.currentTime = 0

    // send('convertToGray')

    const sharpArr = []
    const laplacianArr = []
    const captureArr = []
    const duration = $video.duration
    for (let i = 0; i < duration / TIME_SECOND; i++) {
      // await send('enque')
      const seekPromise = new Promise(resolve => {
        $video.addEventListener('seeked', resolve, { once: true })
      })
      let start = performance.now()
      c.captureVideoToCanvas($video, $canvas)
      captureArr.push(performance.now() - start)
      start = performance.now()
      c.sharping($canvas)
      sharpArr.push(performance.now() - start)
      start = performance.now()
      c.laplacianFilter($canvas)
      laplacianArr.push(performance.now() - start)
      // console.log(`end laplacian ${performance.now() - start}ms`)
      time += TIME_SECOND
      $video.currentTime += TIME_SECOND
      await seekPromise
    }
    console.log('capture avg', captureArr.reduce((acc, cur) => acc + cur, 0) / captureArr.length)
    console.log('sharp avg', sharpArr.reduce((acc, cur) => acc + cur, 0) / sharpArr.length)
    console.log('laplacian avg', laplacianArr.reduce((acc, cur) => acc + cur, 0) / laplacianArr.length)

    // setTimeout(() => {
    //   postMessageToBackground({ type: 'end' })
    //   console.log('end')
    // }, 1000);
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
      }
      resolve({})
    })
  }

  chrome.runtime.onMessage.addListener<ToContentFromBackground>((msg, sender, sendResponse) => {
    console.log('from background', msg)
    switch(msg.type) {
      case 'convertToGray':
        convertToGray($canvas)(msg);
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