import { convolve3x3 } from "./convolve";
import { BinaryImage } from "./typing/image";

export const binaryNoiseFilter = (binaryImage: BinaryImage, radius = 3, threshold = 0.1) => {
  const result = []
  for (let i = 0; i < binaryImage.data.length; i++) {
    if (!binaryImage.data[i]) {
      result.push(false)
    } else {
      if (getTrueRateInRange(binaryImage, i, radius) > threshold) {
        result.push(true)
      } else {
        result.push(false)
      }
    }
  }
  return result
}

const sharping = ($canvas: HTMLCanvasElement) => {
  const ctx = $canvas.getContext('2d')
  if (!ctx) throw 'failed get 2d context'
  const width = $canvas.width
  const height = $canvas.height
  const imageData = ctx.getImageData(0, 0, width, height)
  const result = new ImageData(width, height)
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ].map(v => v * 10)
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      result.data[(i * width + j) * 4 + 0] = convolve3x3(imageData.data, kernel, i, width, height, j, 0)
      result.data[(i * width + j) * 4 + 1] = convolve3x3(imageData.data, kernel, i, width, height, j, 1)
      result.data[(i * width + j) * 4 + 2] = convolve3x3(imageData.data, kernel, i, width, height, j, 2)
      result.data[(i * width + j) * 4 + 3] = imageData.data[(i * width + j) * 4 + 3]
    }
  }
  ctx.putImageData(result, 0, 0)
  const data = []
  for (let i = 0; i < result.data.length; i++) {
    data.push(result.data[i])
  }
  return data
}

/**
 * trueの割合を出す。有効でないindexについては無視した割合を出す
 * @param radius 3x3探索時1、11*11探索時5
 */
const getTrueRateInRange = (binaryImage: BinaryImage, index: number, radius: number) => {
  const startRow = Math.floor((index - radius * binaryImage.width) / binaryImage.width)
  const endRow = Math.floor((index + radius * binaryImage.width) / binaryImage.width)
  const centerCol = index % binaryImage.width
  
  let length = 0
  let score = 0
  for (let row = startRow > 0 ? startRow : 0; row < (endRow > binaryImage.height ? binaryImage.height : endRow); row++) {
    for (let col = (centerCol - radius > 0 ? centerCol - radius : 0); col < (centerCol + radius < binaryImage.width ? centerCol + radius : binaryImage.width); col++) {
      length++
      if (binaryImage.data[row * binaryImage.width + col]) {
        score++
      }
    }
  }
  return score / length
}
