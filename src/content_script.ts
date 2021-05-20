import { captureVideoToCanvas, setupCanvas } from './lib/canvas'
import { Enque, ToBackgroundFromContent, ToContentFromBackground, ToWebWorkerFromPage } from './lib/typing/message';
import { isChange } from './lib/vn';
import useWorker from './use/worker'
import { getPlayerVideoElement, getVideoElement, hidePlayer, setupPlayer } from './lib/youtube';
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

let enque = (_: Enque) => {}
let sendToAllWorker = (_: ToWebWorkerFromPage) => {}

const boot = async () => {
  if (!isInitialised) {
    console.log('set promises')
    const promises = [
      new Promise<void>(async resolve => {
        eval(await fetch('https://www.youtube.com/player_api').then(v => v.text()))
        eval(await fetch(scriptUrl).then(v => v.text()))
        console.log('end setup2')
        resolve()
      }),
      new Promise<void>(async resolve => {
        const { setupWorkers, enque: _enque, sendToAllWorker: _sendToAllWorker } = useWorker(diffs)
        await setupWorkers()
        console.log('end setup1')
        enque = _enque
        sendToAllWorker = _sendToAllWorker
        resolve()
      })
    ]
    await Promise.all(promises)
    console.log('end setup3')
    isInitialised = true
  }

  player = await setupPlayer(PLAYER_ID, PLAYER_WIDTH, PLAYER_HEIGHT)

  player.playVideo()
  $originalVideo = getVideoElement()
  const $video = getPlayerVideoElement(PLAYER_ID)
  let time = 0
  const TIME_SECOND = 0.5

  $video.addEventListener('loadedmetadata', async () => {
    const start = performance.now()
    const duration = $video.duration
    player.pauseVideo()
    player.seekTo(0, false)

    const rect = $video.getBoundingClientRect()
    $canvas = setupCanvas(rect.width, rect.height)
    hidePlayer(PLAYER_ID)
    $canvas.getContext('2d')!.filter = 'grayscale(1)'

    const loopCount = duration / TIME_SECOND

    const kugiri = Math.floor(loopCount / (100 / PERCENTAGE_SEPARATION))
    let percentageKugiri = 1

    const side = Math.floor(rect.width / 50)
    const cols = Math.ceil(rect.width / side)
    const data = new Uint8Array(rect.width * rect.height)

    for (let i = 0; i < loopCount; i++) {
      const seekPromise = new Promise(resolve => {
        $video.addEventListener('seeked', resolve, { once: true })
      })
      try {
        captureVideoToCanvas($video, $canvas, data, rect.width, rect.height)

        const d = []
        for (let a = 0; a < data.length; a++) {
          d.push(data[a])
        }
        enque({ type: 'enque', data: d, width: rect.width, height: rect.height, cols, side, time })

        time += TIME_SECOND
        $video.currentTime += TIME_SECOND
        await seekPromise
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (e) {
        console.error(e)
      }

      if (percentageKugiri * kugiri < i) {
        console.log(`finish ${percentageKugiri * PERCENTAGE_SEPARATION}%`, `${(performance.now() - start) / 1000}sec`)
        percentageKugiri++
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
