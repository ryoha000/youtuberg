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
