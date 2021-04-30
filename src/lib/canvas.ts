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
  const ctx = $canvas.getContext('2d')!
  ctx.clearRect(0, 0, $canvas.width, $canvas.height);
  ctx.drawImage($video, $canvas.width * ratio, $canvas.height * cutTop, $canvas.width * (1 - ratio * 2), $canvas.height * (1 - cutTop), $canvas.width * ratio, $canvas.height * cutTop, $canvas.width * (1 - ratio * 2), $canvas.height * (1 - cutTop))
  const imgData = ctx.getImageData(0, 0, $canvas.width, $canvas.height)
  ctx.putImageData(imgData, 0, 0)
  return Array.from(ctx.getImageData(0, 0, $canvas.width, $canvas.height).data)
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
import { findControursFromBinary } from './grouping'
import { binaryToData, dataToBinary } from './utils'
export const laplacianFilter = ($canvas: HTMLCanvasElement) => {
  const ctx = $canvas.getContext('2d')
  if (!ctx) throw 'failed get 2d context'
  const imageData = ctx.getImageData(0, 0, $canvas.width, $canvas.height)
  const out = ctx.createImageData(imageData.width, imageData.height);
  const outData = out.data;

  const binary = dataToBinary(imageData.data, imageData.width, imageData.height)

  binaryToData(binary, outData)

  const labels: number[] = new Array(imageData.height * imageData.width)
  const contrours: number[] = new Array(imageData.height * imageData.width)
  findControursFromBinary(binary, imageData.height, imageData.width, [], [], [])

  // 各ラベルごとの面積
  const mensekis: number[] = [0]
  for (let i = 0; i < labels.length; i++) {
    if (mensekis[labels[i]]) {
      mensekis[labels[i]]++
    } else {
      mensekis[labels[i]] = 1
    }
  }
  // 各ラベルの縦、横
  const sizes: { left: number, right: number, top: number, bottom: number }[] = []
  for (let i = 0; i < labels.length; i++) {
    const col = i % imageData.width
    const row = Math.floor(i / imageData.width)
    const size = sizes[labels[i]]
    if (size) {
      if (size.left > col) size.left = col
      if (size.right < col) size.right = col
      if (size.top > row) size.top = row
      if (size.bottom < row) size.bottom = row
      sizes[labels[i]] = size
    } else {
      sizes[labels[i]] = { left: col, right: col, top: row, bottom: row }
    }
  }

  const blockSide = imageData.width * 0.02
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] === 0) continue
    if (!sizes[labels[i]]) {
      continue
    }
    if (sizes[labels[i]].right - sizes[labels[i]].left + 1 > blockSide || sizes[labels[i]].bottom - sizes[labels[i]].top + 1 > blockSide) {
      outData[(i) * 4 + 0] = 0
      outData[(i) * 4 + 1] = 0
      outData[(i) * 4 + 2] = 0
      outData[(i) * 4 + 3] = 255
      continue
    }

    // 塗り面積が大きいと無視
    if (mensekis[labels[i]] > blockSide * blockSide * 0.5 || mensekis[labels[i]] < blockSide * blockSide * 0.01) {
      outData[(i) * 4 + 0] = 0
      outData[(i) * 4 + 1] = 0
      outData[(i) * 4 + 2] = 0
      outData[(i) * 4 + 3] = 255
      continue
    } else {
      outData[(i) * 4 + 0] = 255
      outData[(i) * 4 + 1] = 255
      outData[(i) * 4 + 2] = 255
      outData[(i) * 4 + 3] = 255
      continue
    }
  }

  const side = getSide(imageData.width)
  const rows = Math.ceil(imageData.height / side)
  const cols = Math.ceil(imageData.width / side)

  const scores = getScores(outData, imageData.width, imageData.height, rows, cols, side)

  findContrours(scores, rows, cols, labels, contrours, side * side * 0.1)
  getMergedContrours(labels, contrours, scores, cols, side * side * 0.05)
  fillMissingBlock(labels, rows, cols)

  const groupIdColor: [number, number, number][] = []
  function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] === 0) continue

    if (!groupIdColor[labels[i]]) {
      const r = getRandomInt(255)
      const g = getRandomInt(255)
      const b = getRandomInt(255)
      groupIdColor[labels[i]] = [r, g, b]
    }
    const [r, g, b] = groupIdColor[labels[i]]
    const row = Math.floor(i / cols)
    const col = i % cols
    for (let k = row * side; k < Math.min((row + 1) * side, imageData.height); k++) {
      for (let l = col * side; l < Math.min((col + 1) * side, imageData.width); l++) {
        outData[(k * imageData.width + l) * 4 + 0] = r
        outData[(k * imageData.width + l) * 4 + 1] = g
        outData[(k * imageData.width + l) * 4 + 2] = b
        outData[(k * imageData.width + l) * 4 + 3] = 255
      }
    }
  }
  ctx.putImageData(out, 0, 0);
}
