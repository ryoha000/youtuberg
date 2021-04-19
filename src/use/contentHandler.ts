import { ConvertGray } from "../lib/typing/message";

export const convertToGray = ($canvas: HTMLCanvasElement) => (msg: ConvertGray) => {
  console.log('response img from background')
  console.log('msg', msg)
  const { data, width, height } = msg
  const ctx = $canvas.getContext("2d");
  if (!ctx) return
  ctx.clearRect(0, 0, width, height);
  const imgData = ctx.createImageData(width, height);
  if (!imgData) return
  const dataLength = data.length
  console.log('dataLen', dataLength, 'imgDataLen', imgData.data.length)
  for (let i = 0; i < dataLength; i++) {
    imgData.data[i] = data[i]
  }
  console.log(imgData)
  ctx.putImageData(imgData, 0, 0);
}
