import { ConvertGray } from "../lib/typing/message";

export const convertToGray = ($canvas: HTMLCanvasElement) => (msg: ConvertGray) => {
  console.log('response img from background')
  const { data, width, height } = msg
  $canvas.width = width
  $canvas.height = height
  const ctx = $canvas.getContext("2d");
  if (!ctx) return
  ctx.clearRect(0, 0, width, height);
  ctx.filter = 'contrast(100000000000000000000000000%) grayscale(1)'
  const imgData = ctx.createImageData(width, height);
  if (!imgData) return
  const dataLength = data.length
  for (let i = 0; i < dataLength; i++) {
    imgData.data[i] = data[i]
  }
  ctx.putImageData(imgData, 0, 0);
}
