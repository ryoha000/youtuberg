import { captureVideoToCanvas, setupCanvas } from './lib/canvas'
import { End, Enque } from './lib/typing/message';
import { isChange } from './lib/vn';
import useWorker from './use/worker'
import { getPlayerVideoElement, getVideoElement, hidePlayer, setupPlayer } from './lib/youtube';
import { PLAYER_HEIGHT, PLAYER_ID, PLAYER_WIDTH } from './use/const';

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

let enque = (_: Enque) => {}
let sendToAllWorker = (_: End) => {}

const boot = async () => {
  if (!isInitialised) {
    console.log('set promises')
    const promises = [
      new Promise<void>(async resolve => {
        eval(await fetch('https://www.youtube.com/player_api').then(v => v.text()))
        eval(await fetch(scriptUrl).then(v => v.text()))
        resolve()
      }),
      new Promise<void>(async resolve => {
        const { setupWorkers, enque: _enque, sendToAllWorker: _sendToAllWorker } = useWorker(diffs)
        await setupWorkers()
        enque = _enque
        sendToAllWorker = _sendToAllWorker
        resolve()
      })
    ]
    await Promise.all(promises)
    isInitialised = true
  }

  player = await setupPlayer(PLAYER_ID, PLAYER_WIDTH, PLAYER_HEIGHT)

  player.playVideo()
  $originalVideo = getVideoElement()
  const $video = getPlayerVideoElement(PLAYER_ID)
  let time = 0
  const PLAY_BACK_RATE = 3

  $video.addEventListener('loadedmetadata', async () => {
    $video.playbackRate = PLAY_BACK_RATE
    player.seekTo(0, true)

    const rect = $video.getBoundingClientRect()
    $canvas = setupCanvas(rect.width, rect.height)
    hidePlayer(PLAYER_ID)
    $canvas.getContext('2d')!.filter = 'grayscale(1)'

    const side = Math.floor(rect.width / 50)
    const cols = Math.ceil(rect.width / side)
    const data = new Uint8Array(rect.width * rect.height)

    while (true) {
      try {
        player.pauseVideo()

        if (time > $video.currentTime) {
          break
        }
        time = $video.currentTime
        captureVideoToCanvas($video, $canvas, data, rect.width, rect.height)
        const d = Array.from(data)
        enque({ type: 'enque', data: d, width: rect.width, height: rect.height, cols, side, time })
        
        player.playVideo()
        await new Promise(resolve => setTimeout(resolve, 1))
      } catch (e) {
        console.error(e)
      }
    }
    setTimeout(() => {
      sendToAllWorker({ type: 'end' })
      console.log('end')
      console.log(JSON.stringify(diffs))
      for (const index of changes) {
        console.log(diffs[index])
      }
    }, 1000);
  }, { once: true })
}

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
    sendToAllWorker({ type: 'end' })
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
