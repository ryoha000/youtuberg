import { captureVideoToCanvas, setupCanvas } from './lib/canvas'
import { ToBackgroundFromContent, ToContentFromBackground } from './lib/typing/message';
import { isChange } from './lib/vn';
import { getPlayerVideoElement, getVideoElement, setupPlayer } from './lib/youtube';
import { PERCENTAGE_SEPARATION, PLAYER_HEIGHT, PLAYER_ID, PLAYER_WIDTH } from './use/const';

declare var scriptUrl: string

let isInitialised = false
let nowhref = ''
let $canvas: HTMLCanvasElement
let $originalVideo: HTMLVideoElement
let player: YT.Player
const diffs: { time: number, diff: number }[] = []
const changes: number[] = []
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
  $originalVideo = getVideoElement()
  const $video = getPlayerVideoElement(PLAYER_ID)
  $canvas = setupCanvas(PLAYER_WIDTH, PLAYER_HEIGHT)
  $canvas.getContext('2d')!.filter = 'contrast(100000000000000000000000000%) grayscale(1)'
  let time = 0
  const TIME_SECOND = 0.5

  $video.addEventListener('loadedmetadata', async () => {
    const start = performance.now()
    const duration = $video.duration
    player.pauseVideo()
    player.seekTo(0, false)
    $canvas.getContext('2d')!.filter = 'contrast(100000000000000000000000000%) grayscale(1)'
    const loopCount = duration / TIME_SECOND

    const kugiri = Math.floor(loopCount / (100 / PERCENTAGE_SEPARATION))
    let percentageKugiri = 1

    for (let i = 0; i < loopCount; i++) {
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

      if (percentageKugiri * kugiri < i) {
        console.log(`finish ${percentageKugiri * PERCENTAGE_SEPARATION}%`, `${(performance.now() - start) / 1000}sec`)
        percentageKugiri++
      }
    }
    setTimeout(() => {
      postMessageToBackground({ type: 'end' })
      console.log('end')
      console.log(JSON.stringify(diffs))
      for (const index of changes) {
        console.log(diffs[index])
      }
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
      const index = isChange(diffs)
      if (index !== -1) {
        changes.push(index)
      }
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

window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const nowTime = $originalVideo.currentTime
    for (const index of changes) {
      if (diffs[index].time > nowTime) {
        $originalVideo.currentTime = diffs[index].time - 0.25
        console.log(`to ${diffs[index].time} from ${nowTime}`)
        break
      }
    }
  }
})

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
