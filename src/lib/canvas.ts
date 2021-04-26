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
  $canvas.getContext('2d')?.drawImage($video, $canvas.width * ratio, $canvas.height * ratio, $canvas.width * (1 - ratio * 2), $canvas.height * (1 - ratio), $canvas.width * ratio, $canvas.height * ratio, $canvas.width * (1 - ratio * 2), $canvas.height * (1 - ratio))
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

import { getBlockGroups, getBlocks, getMergedLongest, getSide } from './block'
export const laplacianFilter = ($canvas: HTMLCanvasElement) => {
  const ctx = $canvas.getContext('2d')
  if (!ctx) throw 'failed get 2d context'
  const imageData = ctx.getImageData(0, 0, $canvas.width, $canvas.height)
  const out = ctx.createImageData(imageData.width, imageData.height);
  const outData = out.data;
  const kernel = [1, 1, 1, 1, -8, 1, 1, 1, 1];
  let y: number
  let l: number
  let ref = imageData.height - 1
  let i: number
  for (y = l = 1; 1 <= ref ? l < ref : l > ref; y = 1 <= ref ? ++l : --l) {
    let x: number
    let m: number
    let ref1 = imageData.width - 1
    for (x = m = 1; 1 <= ref1 ? m < ref1 : m > ref1; x = 1 <= ref1 ? ++m : --m) {
      let c: number
      let n: number
      for (c = n = 0; n < 3; c = ++n) {
        i = (y * imageData.width + x) * 4 + c;
        let tmp = 0;
        let dy: number
        let o: number
        for (dy = o = -1; o <= 1; dy = ++o) {
          let dx: number
          let p: number
          for (dx = p = -1; p <= 1; dx = ++p) {
            const kernelIndex = (dy + 1) * 3 + (dx + 1);
            const dataIndex = ((y + dy) * imageData.width + (x + dx)) * 4 + c;
            tmp += kernel[kernelIndex] * imageData.data[dataIndex];
          }
        }
        if (tmp > 255) {
          outData[i] = 255;
        }
        if (tmp < 0) {
          outData[i] = 0;
        } else {
          outData[i] = tmp;
        }
      }
      const alphaIndex = (y * imageData.width + x) * 4 + 3;
      outData[alphaIndex] = imageData.data[alphaIndex];
    }
  }
  const side = getSide(imageData.width)
  const blocks = getBlocks(outData, imageData.width, imageData.height, side)
  let blockGroups = getBlockGroups(blocks, imageData.width, imageData.height, side, side * side * 0.175)
  function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  // const sleep = (msec: number) => new Promise(resolve => setTimeout(resolve, msec))
  // setTimeout(async () => {
    const start = performance.now()
    let longest = getMergedLongest(blockGroups, 2)
    blockGroups = [...blockGroups, longest]
    longest = getMergedLongest(blockGroups, 2)
    for (let aa = 0; aa < 2; aa++) {
      // await sleep(300)
      blockGroups = [...blockGroups, longest]
      longest = getMergedLongest(blockGroups, 1)
    }
    const r = getRandomInt(255)
    const g = getRandomInt(255)
    const b = getRandomInt(255)
    for (const block of longest.blocks) {
      for (let k = block.row * side; k < Math.min((block.row + 1) * side, imageData.height); k++) {
        for (let l = block.col * side; l < Math.min((block.col + 1) * side, imageData.width); l++) {
          outData[(k * imageData.width + l) * 4 + 0] = r
          outData[(k * imageData.width + l) * 4 + 1] = g
          outData[(k * imageData.width + l) * 4 + 2] = b
          outData[(k * imageData.width + l) * 4 + 3] = 255
        }
      }
    }
    ctx.putImageData(out, 0, 0);
    console.log('end merged', `${performance.now() - start}ms`)
  // }, 2000);

  // for (const bg of blockGroups) {
  //   const r = getRandomInt(255)
  //   const g = getRandomInt(255)
  //   const b = getRandomInt(255)
  //   for (const block of bg.blocks) {
  //     for (let k = block.row * side; k < Math.min((block.row + 1) * side, imageData.height); k++) {
  //       for (let l = block.col * side; l < Math.min((block.col + 1) * side, imageData.width); l++) {
  //         outData[(k * imageData.width + l) * 4 + 0] = r
  //         outData[(k * imageData.width + l) * 4 + 1] = g
  //         outData[(k * imageData.width + l) * 4 + 2] = b
  //         outData[(k * imageData.width + l) * 4 + 3] = 255
  //       }
  //     }
  //   }
  // }
  // ctx.putImageData(out, 0, 0);

  // fill(outData, imageData.width, imageData.height)
}

const fill = (data: Uint8ClampedArray, width: number, height: number) => {
  const tanni = Math.ceil(width * 0.025)
  const sikiiti = 60
  const result = []
  for (let i = 0; i < Math.ceil(height / tanni); i++) {
    for (let j = 0; j < Math.ceil(width / tanni); j++) {
      let whiteNum = 0
      for (let k = i * tanni; k < Math.min((i + 1) * tanni, height); k++) {
        for (let l = j * tanni; l < Math.min((j + 1) * tanni, width); l++) {
          if (data[(k * width + l) * 4 + 0] === 255 &&
            data[(k * width + l) * 4 + 1] === 255 &&
            data[(k * width + l) * 4 + 2] === 255 &&
            data[(k * width + l) * 4 + 3] === 255
          ) {
            whiteNum++
          }
        }
      }
      console.log(whiteNum / (tanni * tanni))
      if (whiteNum > tanni * tanni * 0.50) continue
      result.push({ i, j, whiteNum })
    }
  }
  result.sort((a, b) => b.whiteNum - a.whiteNum)
  let count = 0
  for (const { i, j, whiteNum } of result) {
    count++
    // if (count > sikiiti) break
    if (whiteNum < tanni * tanni * 0.175) break
    for (let k = i * tanni; k < Math.min((i + 1) * tanni, height); k++) {
      for (let l = j * tanni; l < Math.min((j + 1) * tanni, width); l++) {
        data[(k * width + l) * 4 + 0] = 255
        data[(k * width + l) * 4 + 1] = 255
        data[(k * width + l) * 4 + 2] = 255
        data[(k * width + l) * 4 + 3] = 255
      }
    }
  }
}

const kernel = [
  0, -1, 0,
  -1, 5, -1,
  0, -1, 0
].map(v => v * 10)

export const sharping = ($canvas: HTMLCanvasElement) => {
  const ctx = $canvas.getContext('2d')
  if (!ctx) throw 'failed get 2d context'
  const width = $canvas.width
  const height = $canvas.height
  const imageData = ctx.getImageData(0, 0, width, height)
  const result = new ImageData(width, height)
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      result.data[(i * width + j) * 4 + 0] = getMatrix(imageData.data, i, width, j, 0)
      result.data[(i * width + j) * 4 + 1] = getMatrix(imageData.data, i, width, j, 1)
      result.data[(i * width + j) * 4 + 2] = getMatrix(imageData.data, i, width, j, 2)
      result.data[(i * width + j) * 4 + 3] = imageData.data[(i * width + j) * 4 + 3]
    }
  }
  ctx.putImageData(result, 0, 0)
}

const getEle = (data: Uint8ClampedArray, width: number, suffix: number, row: number, col: number) => {
  if (row >= 0 && col >= 0) {
    return data[(row * width + col) * 4 + suffix]
  }
  return 0
}
const getMatrix = (data: Uint8ClampedArray, i: number, width: number, j: number, suffix: number) => {
  return (
      kernel[0] * getEle(data, width, suffix, i - 1, j - 1)
    + kernel[1] * getEle(data, width, suffix, i - 1, j    )
    + kernel[2] * getEle(data, width, suffix, i - 1, j + 1)
    + kernel[3] * getEle(data, width, suffix, i    , j - 1)
    + kernel[4] * getEle(data, width, suffix, i    , j    )
    + kernel[5] * getEle(data, width, suffix, i    , j + 1)
    + kernel[6] * getEle(data, width, suffix, i + 1, j - 1)
    + kernel[7] * getEle(data, width, suffix, i + 1, j    )
    + kernel[8] * getEle(data, width, suffix, i + 1, j + 1)
  )
}

