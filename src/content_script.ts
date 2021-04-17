import * as c from './lib/canvas'
import { ConvertGray, ToBackgroundFromContent, ToContentFromBackground } from './lib/typing/message';
try {
  const $video = c.getVideoElement()
  const $canvas = c.setupCanvas()
  const videoRect = $video.getClientRects()
  $canvas.width = videoRect[0].width
  $canvas.height = videoRect[0].height
  c.captureVideoToCanvas($video, $canvas)
  const ctx = $canvas.getContext('2d')
  if (!ctx) throw 'could not get ctx'
  const imgData = ctx.getImageData(0, 0, $canvas.width, $canvas.height)
  console.log('imgData', imgData)
  const buf = imgData.data.buffer
  if (!(new Uint8Array(buf)).some(v => v !== 0)) console.log('buf all 0')
  const arr = Array.from(new Uint8Array(buf))
  if (!arr.some(v => v !== 0)) console.log('arr all 0')
  if (imgData) {
    setTimeout(() => {
      const msg: ConvertGray = { type: 'convertToGray', data: arr, width: $canvas.width, height: $canvas.height }
      console.log("send background", msg)
      postMessageToBackground(msg)
    }, 1000);
  }
  chrome.runtime.onMessage.addListener<ToContentFromBackground>((msg, sender, sendResponse) => {
    if (msg.type === 'convertToGray') {
      console.log('response img from background')
      console.log('msg', msg)
      const { data, width, height } = msg
      const ctx = $canvas.getContext("2d");
      if (!ctx) return true
      ctx.clearRect(0, 0, width, height);
      const imgData = ctx.createImageData(width, height);
      if (!imgData) return true
      const dataLength = data.length
      console.log('dataLen', dataLength, 'imgDataLen', imgData.data.length)
      for (let i = 0; i < dataLength; i++) {
        imgData.data[i] = data[i]
      }
      console.log(imgData)
      ctx.putImageData(imgData, 0, 0);
    }
    sendResponse()
    return true
  })
  const postMessageToBackground = (msg: ToBackgroundFromContent) => chrome.runtime.sendMessage(msg, () => {})
} catch (e) {
  console.warn(e)
}