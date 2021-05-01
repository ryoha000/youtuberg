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
  const ratio = 0
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

import { fillMissingBlock, getMergedContrours, getScores, getScoresBinary, getSide } from './block'
import { findControursFromBinary } from './contrours'
import { binaryGroupedSizeFilter } from './filter'
import { groupByScores } from './grouping'
import { binaryToData, dataToBinary } from './utils'
export const laplacianFilter = ($canvas: HTMLCanvasElement) => {
  const ctx = $canvas.getContext('2d')
  if (!ctx) throw 'failed get 2d context'
  const imageData = ctx.getImageData(0, 0, $canvas.width, $canvas.height)
  const out = ctx.createImageData(imageData.width, imageData.height);
  const outData = out.data;

  const binary = dataToBinary(imageData.data, imageData.width, imageData.height)

  const labels: number[] = new Array(imageData.width * imageData.height)
  const contrours: number[] = new Array(imageData.width * imageData.height)
  const areas: number[] = []
  const sizes: { rows: number, cols: number }[] = []
  findControursFromBinary(binary, imageData.height, imageData.width, labels, contrours, areas, sizes)

  const blockSide = imageData.width * 0.02
  const noiseFilteredBinary = binaryGroupedSizeFilter(labels, areas, sizes, blockSide)
  binaryToData(noiseFilteredBinary, outData)

  const side = getSide(imageData.width)
  const rows = Math.ceil(imageData.height / side)
  const cols = Math.ceil(imageData.width / side)
  const scores = getScoresBinary(noiseFilteredBinary, imageData.width, imageData.height, rows, cols, side)
  const groupedLabels = new Array(imageData.width * imageData.height)
  groupByScores(scores, rows, cols, groupedLabels, contrours, side * side * 0.1)
  getMergedContrours(groupedLabels, contrours, scores, cols, side * side * 0.05)
  fillMissingBlock(groupedLabels, rows, cols)

  // ブロックのビジュアライズ
  const groupIdColor: [number, number, number][] = []
  function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }
  for (let i = 0; i < groupedLabels.length; i++) {
    if (groupedLabels[i] === 0) continue
    if (!groupIdColor[groupedLabels[i]]) {
      const r = getRandomInt(255)
      const g = getRandomInt(255)
      const b = getRandomInt(255)
      groupIdColor[groupedLabels[i]] = [r, g, b]
    }
    const [r, g, b] = groupIdColor[groupedLabels[i]]
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
