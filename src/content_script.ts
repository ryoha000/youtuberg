import { captureVideoToCanvas, setupCanvas } from './lib/canvas'
import { compareGroup } from './lib/compareGroup';
import { sharping } from './lib/filter';
import { ToBackgroundFromContent, ToContentFromBackground } from './lib/typing/message';
import { getPlayerVideoElement, getVideoElement, setupPlayer } from './lib/youtube';
import { PLAYER_HEIGHT, PLAYER_ID, PLAYER_WIDTH } from './use/const';
import { convertToBinary } from './use/contentHandler';

declare var scriptUrl: string

let isInitialised = false
let nowhref = ''
let $canvas: HTMLCanvasElement
let player: YT.Player
const diffs: { time: number, diff: number }[] = []
const sendToBackgroundData: number[] = []
for (let i = 0; i < PLAYER_HEIGHT * PLAYER_WIDTH; i++) {
  sendToBackgroundData.push(0)
}

const boot = async () => {
  if (!isInitialised) {
    eval(await fetch('https://www.youtube.com/player_api').then(v => v.text()))
    eval(await fetch(scriptUrl).then(v => v.text()))
    isInitialised = true
  }

  const send = (type: Valueof<Pick<ToBackgroundFromContent, 'type'>>, data: number[]) => {
    return new Promise((resolve) => {
      const msg = { type, time, data, width: $canvas.width, height: $canvas.height }
      postMessageToBackground(msg)
      resolve({})
    })
  }

  player = await setupPlayer(PLAYER_ID, PLAYER_WIDTH, PLAYER_HEIGHT)

  player.playVideo()
  const $video = getPlayerVideoElement(PLAYER_ID)
  $canvas = setupCanvas(PLAYER_WIDTH, PLAYER_HEIGHT)
  $canvas.getContext('2d')!.filter = 'contrast(100000000000000000000000000%) grayscale(1)'
  let time = 0
  const TIME_SECOND = 0.5

  $video.addEventListener('loadedmetadata', async () => {
    const duration = $video.duration
    player.pauseVideo()
    player.seekTo(0, false)
    $canvas.getContext('2d')!.filter = 'contrast(100000000000000000000000000%) grayscale(1)'
    for (let i = 0; i < duration / TIME_SECOND; i++) {
      const seekPromise = new Promise(resolve => {
        $video.addEventListener('seeked', resolve, { once: true })
      })
      try {
        captureVideoToCanvas($video, $canvas, sendToBackgroundData, PLAYER_WIDTH, PLAYER_HEIGHT)
        // const data = sharping($canvas)
        send('convertToBinary', sendToBackgroundData)
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
  }, { once: true })
}

const postMessageToBackground = (msg: ToBackgroundFromContent) => chrome.runtime.sendMessage(msg, () => {})

chrome.runtime.onMessage.addListener<ToContentFromBackground>((msg, _, sendResponse) => {
  switch(msg.type) {
    case 'convertToBinary':
      break
    case 'compareResult':
      break
    case 'comparePixel':
      diffs.push({ time: msg.time, diff: msg.result })
      break
    default:
      const _exhaustiveCheck: never = msg
  }
  sendResponse()
  return true
})

try {
  nowhref = location.href
  boot()
} catch (e) {
  console.warn(e)
}

setInterval(() => {
  if (nowhref !== location.href) {
    nowhref = location.href
    postMessageToBackground({ type: 'end' })
    try {
      try {
        if (isInitialised) {
          diffs.splice(0, diffs.length)
          player.destroy()
          $canvas.remove()
        }
      } catch {}
      boot()
    } catch (e) {
      console.warn(e)
    }
  }
}, 500)
