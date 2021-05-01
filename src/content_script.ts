import { captureVideoToCanvas, getVideoElement, setupCanvas } from './lib/canvas'
import { compareGroup } from './lib/compareGroup';
import { sharping } from './lib/filter';
import { ToBackgroundFromContent, ToContentFromBackground } from './lib/typing/message';
import { convertToBinary } from './use/contentHandler';

try {
  const $video = getVideoElement()
  const $canvas = setupCanvas()
  let time = 0
  const TIME_SECOND = 1.5

  const labels: number[][] = []
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

    const duration = $video.duration
    const sleep = (msec: number) => new Promise(resolve => setTimeout(resolve, msec))
    for (let i = 0; i < duration / TIME_SECOND; i++) {
      const seekPromise = new Promise(resolve => {
        $video.addEventListener('seeked', resolve, { once: true })
      })
      try {
        const data = captureVideoToCanvas($video, $canvas)
        // const data = sharping($canvas)
        send('convertToBinary', data)
        time += TIME_SECOND
        // await sleep(800)
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
        const res = convertToBinary($canvas)(msg)
        side = res.side
        cols = res.cols
        labels.push(res.label)
        if (labels.length === 2) {
          // compareGroup($canvas, labels[0], labels[1], cols, side)
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
} catch (e) {
  console.warn(e)
}
