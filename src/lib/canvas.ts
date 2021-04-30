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
import { findContrours, findControursBinary } from './contrours'
import { convolve3x3, convolveBinary3x3 } from './convolve'
import { binaryNoiseFilter } from './filter'
import { close3x3, dilate, dilate3x3, open3x3 } from './morphology'
import { binaryToData, dataToBinary } from './utils'
export const laplacianFilter = ($canvas: HTMLCanvasElement) => {
  const ctx = $canvas.getContext('2d')
  if (!ctx) throw 'failed get 2d context'
  const imageData = ctx.getImageData(0, 0, $canvas.width, $canvas.height)
  const out = ctx.createImageData(imageData.width, imageData.height);
  const outData = out.data;
  const kernel = [1, 1, 1, 1, -8, 1, 1, 1, 1];

  // for (let i = 0; i < imageData.height; i++) {
  //   for (let j = 0; j < imageData.width; j++) {
  //     outData[(i * imageData.width + j) * 4 + 0] = convolve3x3(imageData.data, kernel, i, imageData.width, imageData.height, j, 0)
  //     outData[(i * imageData.width + j) * 4 + 1] = convolve3x3(imageData.data, kernel, i, imageData.width, imageData.height, j, 1)
  //     outData[(i * imageData.width + j) * 4 + 2] = convolve3x3(imageData.data, kernel, i, imageData.width, imageData.height, j, 2)
  //     outData[(i * imageData.width + j) * 4 + 3] = imageData.data[(i * imageData.width + j) * 4 + 3]
  //   }
  // }

  const binary = dataToBinary(imageData.data, imageData.width, imageData.height)
  // const laplacianBinary = []
  // for (let i = 0; i < imageData.height; i++) {
  //   for (let j = 0; j < imageData.width; j++) {
  //     laplacianBinary.push(convolveBinary3x3(binary, kernel, i, j, imageData.width, imageData.height))
  //   }
  // }

  const noiseBinary = binaryNoiseFilter({ width: imageData.width, height: imageData.height, data: binary }, 3, 0.1)
  // const dilatedBinary = dilate({ width: imageData.width, height: imageData.height, data: noiseBinary }, 3, 5)

  // const binary = dataToBinary(imageData.data, imageData.width, imageData.height)
  // const newBinary = open3x3({ width: imageData.width, height: imageData.height, data: binary })

  // const molKernel = [-1, 1, -1, 1, 1, 1, -1, 1, -1]
  // // const molBinary = close3x3({ width: imageData.width, height: imageData.height, data: newBinary })
  // const molBinary = []
  // for (let i = 0; i < imageData.height; i++) {
  //   for (let j = 0; j < imageData.width; j++) {
  //     molBinary.push(convolveBinary3x3(newBinary, molKernel, i, j, imageData.width, imageData.height))
  //   }
  // }

  // const molDBinary = dilate3x3({ width: imageData.width, height: imageData.height, data: newBinary })
  // for (let i = 0; i < imageData.height; i++) {
  //   for (let j = 0; j < imageData.width; j++) {
  //     molDBinary.push(convolveBinary3x3(newBinary, molDKernel, i, j, imageData.width, imageData.height))
  //   }
  // }

  // const data: number[] = new Array(noiseBinary.length * 4)

  // for (let i = 0; i < binary.length; i++) {
  //   if (binary[i]) {
  //     data[i * 4 + 0] = 255
  //     data[i * 4 + 1] = 255
  //     data[i * 4 + 2] = 255
  //   } else {
  //     data[i * 4 + 0] = 0
  //     data[i * 4 + 1] = 0
  //     data[i * 4 + 2] = 0
  //   }
  //   data[i * 4 + 3] = 255
  // }
  // return data

  binaryToData(noiseBinary, outData)

  // // let isBinary = true
  // for (let i = 0; i < outData.length; i++) {
  //   outData[i] = imageData.data[i]
  // }
  // console.log('isBinary', isBinary)
  // console.log('end laplacian filter', (performance.now() - filterStart) / 1000)

  const side = 1
  // const side = getSide(imageData.width)
  const rows = Math.ceil(imageData.height / side)
  const cols = Math.ceil(imageData.width / side)
  const scores = getScores(outData, imageData.width, imageData.height, rows, cols, side)
  const labels: number[] = new Array(rows * cols)
  const contrours: number[] = new Array(rows * cols)
  // findContrours(scores, rows, cols, labels, contrours, side * side * 0.12, 1)
  findControursBinary(noiseBinary, rows, cols, labels, contrours)
  // findContrours(scores, rows, cols, labels, contrours, side * side * 0.45, side * side * 0.95)
  // getMergedContrours(labels, contrours, cols)
  // fillMissingBlock(labels, rows, cols)

  // console.log('end merge も', (performance.now() - filterStart) / 1000)



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
  const blockSide = imageData.width * 0.02
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



  function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  const groupIdColor: [number, number, number][] = []
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] === 0) continue
    if (!sizes[labels[i]]) {
      // console.warn(`not exist size, ${i} ${labels[i]}`)
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
    if (mensekis[labels[i]] > blockSide * blockSide * 0.5) {
      outData[(i) * 4 + 0] = 0
      outData[(i) * 4 + 1] = 0
      outData[(i) * 4 + 2] = 0
      outData[(i) * 4 + 3] = 255
      continue
    } else if (mensekis[labels[i]] < blockSide * blockSide * 0.01) {
      outData[(i) * 4 + 0] = 0
      outData[(i) * 4 + 1] = 0
      outData[(i) * 4 + 2] = 0
      outData[(i) * 4 + 3] = 255
      continue
    } {
      outData[(i) * 4 + 0] = 255
      outData[(i) * 4 + 1] = 255
      outData[(i) * 4 + 2] = 255
      outData[(i) * 4 + 3] = 255
      continue
    }

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
  const data: number[] = new Array(noiseBinary.length * 4)

  for (let i = 0; i < outData.length; i++) {
    data[i] = outData[i]
    // if (binary[i]) {
    //   data[i * 4 + 0] = 255
    //   data[i * 4 + 1] = 255
    //   data[i * 4 + 2] = 255
    // } else {
    //   data[i * 4 + 0] = 0
    //   data[i * 4 + 1] = 0
    //   data[i * 4 + 2] = 0
    // }
    // data[i * 4 + 3] = 255
  }


  {
    // const b = dataToBinary(outData, imageData.width, imageData.height)
    // const dilatedBinary = dilate({ width: imageData.width, height: imageData.height, data: b }, 1, 1)
    // binaryToData(dilatedBinary, outData)

    // const side = 1
    const side = getSide(imageData.width)
    const rows = Math.ceil(imageData.height / side)
    const cols = Math.ceil(imageData.width / side)
    const scores = getScores(outData, imageData.width, imageData.height, rows, cols, side)
    const labels: number[] = new Array(rows * cols)
    const contrours: number[] = new Array(rows * cols)
    // findContrours(scores, rows, cols, labels, contrours, side * side * 0.12, 1)
    findContrours(scores, rows, cols, labels, contrours, side * side * 0.1, side * side)
    getMergedContrours(labels, contrours, scores, cols, side * side * 0.05)
    fillMissingBlock(labels, rows, cols)
    const groupIdColor: [number, number, number][] = []
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




  return data
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
  const data = []
  for (let i = 0; i < result.data.length; i++) {
    data.push(result.data[i])
  }
  return data
}
