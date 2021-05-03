import { captureVideoToCanvas, setupCanvas } from './lib/canvas'
import { compareGroup } from './lib/compareGroup';
import { sharping } from './lib/filter';
import { ToBackgroundFromContent, ToContentFromBackground } from './lib/typing/message';
import { getVideoElement, setupPlayer, trackingOriginalVideo } from './lib/youtube';
import { convertToBinary } from './use/contentHandler';

declare var scriptUrl: string

const PLAYER_ID = 'youtuberg-player'

const boot = async () => {
  eval(await fetch('https://www.youtube.com/player_api').then(v => v.text()))
  eval(await fetch(scriptUrl).then(v => v.text()))

  const $video = getVideoElement(PLAYER_ID)
  const youtubergPlayer = await setupPlayer(PLAYER_ID, $video)
  const resizeObserver = trackingOriginalVideo($video, PLAYER_ID)
  const $canvas = setupCanvas()
  let time = 0
  const TIME_SECOND = 0.2

  const labels: number[][] = []
  const diffs: { time: number, diff: number }[] = []
  let longests: number[] = []
  let side = 0
  let cols = 0
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
        const res = convertToBinary($canvas)(msg)
        side = res.side
        cols = res.cols
        labels.push(res.label)
        if (labels.length === 2) {
          const d = compareGroup($canvas, labels[0], labels[1], cols, side)
          diffs.push({ time: msg.time, diff: d.filter(v => v === 1).length })
          labels.shift()
        }

        // longestの保存
        if (res.label.length !== longests.length) {
          longests = []
          for (let i = 0; i < res.label.length; i++) {
            longests.push(0)
          }
        }
        for (let i = 0; i < res.label.length; i++) {
          if (res.longestIds.includes(res.label[i])) {
            longests[i]++
          }
        }

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
}

try {
  boot()
} catch (e) {
  console.warn(e)
}
