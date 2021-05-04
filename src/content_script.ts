import { captureVideoToCanvas, setupCanvas } from './lib/canvas'
import { compareGroup } from './lib/compareGroup';
import { sharping } from './lib/filter';
import { ToBackgroundFromContent, ToContentFromBackground } from './lib/typing/message';
import { getVideoElement, setupPlayer, trackingOriginalVideo } from './lib/youtube';
import { convertToBinary } from './use/contentHandler';

declare var scriptUrl: string

let isInitialised = false
let resizeObserver: ResizeObserver
let nowhref = ''
let $canvas: HTMLCanvasElement
const PLAYER_ID = 'youtuberg-player'

const boot = async () => {
  if (!isInitialised) {
    eval(await fetch('https://www.youtube.com/player_api').then(v => v.text()))
    eval(await fetch(scriptUrl).then(v => v.text()))
    isInitialised = true
  }

  const $video = getVideoElement(PLAYER_ID)
  const youtubergPlayer = await setupPlayer(PLAYER_ID, $video)
  resizeObserver = trackingOriginalVideo($video, PLAYER_ID)
  $canvas = setupCanvas()
  let time = 0
  const TIME_SECOND = 0.5

  const diffs: { time: number, diff: number }[] = []
  setTimeout(async () => {
    // TODO: meteadataのloadとかでしっかりとる
    const videoRect = $video.getClientRects()
    $canvas.width = videoRect[0].width
    $canvas.height = videoRect[0].height

    $video.pause()
    $video.currentTime = 0
    $canvas.getContext('2d')!.filter = 'contrast(100000000000000000000000000%) grayscale(1)'

    const sleep = (msec: number) => new Promise(resolve => setTimeout(resolve, msec))

    const duration = $video.duration
    for (let i = 0; i < duration / TIME_SECOND; i++) {
      const seekPromise = new Promise(resolve => {
        $video.addEventListener('seeked', resolve, { once: true })
      })
      try {
        const data = captureVideoToCanvas($video, $canvas)
        // const data = sharping($canvas)
        send('convertToBinary', data)
        time += TIME_SECOND
        $video.currentTime += TIME_SECOND
        await seekPromise
      } catch {}
    }

    setTimeout(() => {
      postMessageToBackground({ type: 'end' })
      console.log('end')
      console.log(JSON.stringify(diffs))
    }, 1000);
  }, 2000);
  
  const send = (type: Valueof<Pick<ToBackgroundFromContent, 'type'>>, data: number[]) => {
    return new Promise((resolve) => {
      const msg = { type, time, data, width: $canvas.width, height: $canvas.height }
      postMessageToBackground(msg)
      resolve({})
    })
  }

  chrome.runtime.onMessage.addListener<ToContentFromBackground>((msg, _, sendResponse) => {
    switch(msg.type) {
      case 'convertToBinary':
        break
      case 'compareResult':
        break
      case 'comparePixel':
        console.log(msg)
        diffs.push({ time: msg.time, diff: msg.result })
        break
      default:
        const _exhaustiveCheck: never = msg
    }
    sendResponse()
    return true
  })
  const postMessageToBackground = (msg: ToBackgroundFromContent) => chrome.runtime.sendMessage(msg, () => {})
}

try {
  nowhref = location.href
  boot()
} catch (e) {
  console.warn(e)
}

setInterval(() => {
  if (nowhref !== location.href) {
    nowhref = location.href
    try {
      if (isInitialised) {
        resizeObserver.disconnect()
        document.getElementById(PLAYER_ID)?.remove()
        $canvas.remove()
      }
      boot()
    } catch (e) {
      console.warn(e)
    }
  }
}, 500)
