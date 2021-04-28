export const setupCanvas = () => {
  const $canvas = document.createElement('canvas')
  document.body.appendChild($canvas)
  $canvas.style.cssText = `
  position: absolute;
  top: 0;
  right: 0;
  background: black;
  object-fit: contain;
  `
  return $canvas
}

export const captureVideoToCanvas = ($video: HTMLVideoElement, $canvas: HTMLCanvasElement) => {
  const ratio = 0.1
  const cutTop = 0
  $canvas.getContext('2d')?.drawImage($video, $canvas.width * ratio, $canvas.height * cutTop, $canvas.width * (1 - ratio * 2), $canvas.height * (1 - cutTop), $canvas.width * ratio, $canvas.height * cutTop, $canvas.width * (1 - ratio * 2), $canvas.height * (1 - cutTop))
}

export const getVideoElement = () => {
  const $videos = document.getElementsByTagName('video')
  if ($videos.length === 0) {
    throw 'video element not found'
  }
  return $videos[0]
}

export const getBlobURL = ($canvas: HTMLCanvasElement) => {
  return new Promise<string>(resolve => {
    $canvas.toBlob(blob => {
      resolve(URL.createObjectURL(blob))
    })
  })
}

import { fillMissingBlock, getMergedContrours, getScores, getSide } from './block'
import { findContrours } from './contrours'
import { convolve3x3 } from './convolve'
export const laplacianFilter = ($canvas: HTMLCanvasElement) => {
  const filterStart = performance.now()
  const ctx = $canvas.getContext('2d')
  if (!ctx) throw 'failed get 2d context'
  const imageData = ctx.getImageData(0, 0, $canvas.width, $canvas.height)
  const out = ctx.createImageData(imageData.width, imageData.height);
  const outData = out.data;
  const kernel = [1, 1, 1, 1, -8, 1, 1, 1, 1];

  for (let i = 0; i < imageData.height; i++) {
    for (let j = 0; j < imageData.width; j++) {
      outData[(i * imageData.width + j) * 4 + 0] = convolve3x3(imageData.data, kernel, i, imageData.width, imageData.height, j, 0)
      outData[(i * imageData.width + j) * 4 + 1] = convolve3x3(imageData.data, kernel, i, imageData.width, imageData.height, j, 1)
      outData[(i * imageData.width + j) * 4 + 2] = convolve3x3(imageData.data, kernel, i, imageData.width, imageData.height, j, 2)
      outData[(i * imageData.width + j) * 4 + 3] = imageData.data[(i * imageData.width + j) * 4 + 3]
    }
  }

  // true => white, false => black
  const binary = []
  for (let i = 0; i < imageData.height; i++) {
    for (let j = 0; j < imageData.width; j++) {
      if (
        outData[(i * imageData.width + j) * 4 + 0] > 200 &&
        outData[(i * imageData.width + j) * 4 + 1] > 200 &&
        outData[(i * imageData.width + j) * 4 + 2] > 200
      ) {
        binary.push(true)
      } else {
        binary.push(false)
      }
    }
  }

  for (let i = 0; i < binary.length; i++) {
    if (binary[i]) {
      outData[i * 4 + 0] = 255
      outData[i * 4 + 1] = 255
      outData[i * 4 + 2] = 255
    } else {
      outData[i * 4 + 0] = 0
      outData[i * 4 + 1] = 0
      outData[i * 4 + 2] = 0
    }
    outData[i * 4 + 3] = 255
  }

  // let isBinary = true
  // for (let i = 0; i < outData.length; i++) {
  //   outData[i] = imageData.data[i]
  // }
  // console.log('isBinary', isBinary)
  // console.log('end laplacian filter', (performance.now() - filterStart) / 1000)

  // const side = getSide(imageData.width)
  const side = 1
  const rows = Math.ceil(imageData.height / side)
  const cols = Math.ceil(imageData.width / side)
  const scores = getScores(outData, imageData.width, imageData.height, rows, cols, side)
  const labels: number[] = new Array(rows * cols)
  const contrours: number[] = new Array(rows * cols)
  findContrours(scores, rows, cols, labels, contrours, side * side * 0.12, 1)
  // findContrours(scores, rows, cols, labels, contrours, side * side * 0.12, side * side * 0.30)
  // getMergedContrours(labels, contrours, cols)
  // fillMissingBlock(labels, rows, cols)

  // console.log('end merge も', (performance.now() - filterStart) / 1000)

  function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  // const groupIdColor: [number, number, number][] = []
  // for (let i = 0; i < labels.length; i++) {
  //   if (labels[i] === 0) continue
  //   if (!groupIdColor[labels[i]]) {
  //     const r = getRandomInt(255)
  //     const g = getRandomInt(255)
  //     const b = getRandomInt(255)
  //     groupIdColor[labels[i]] = [r, g, b]
  //   }
  //   const [r, g, b] = groupIdColor[labels[i]]
  //   const row = Math.floor(i / cols)
  //   const col = i % cols
  //   for (let k = row * side; k < Math.min((row + 1) * side, imageData.height); k++) {
  //     for (let l = col * side; l < Math.min((col + 1) * side, imageData.width); l++) {
  //       outData[(k * imageData.width + l) * 4 + 0] = r
  //       outData[(k * imageData.width + l) * 4 + 1] = g
  //       outData[(k * imageData.width + l) * 4 + 2] = b
  //       outData[(k * imageData.width + l) * 4 + 3] = 255
  //     }
  //   }
  // }
  ctx.putImageData(out, 0, 0);
}

export const sharping = ($canvas: HTMLCanvasElement) => {
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
}
