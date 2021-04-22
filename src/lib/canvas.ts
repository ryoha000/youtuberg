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
  $canvas.getContext('2d')?.drawImage($video, 0, 0, $canvas.width, $canvas.height)
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
  ctx.putImageData(out, 0, 0);
}

const kernel = [
  0, -1, 0,
  -1, 5, -1,
  0, -1, 0
].map(v => v * 10)

export const sharping = ($canvas: HTMLCanvasElement) => {
  const start = performance.now()
  const ctx = $canvas.getContext('2d')!
  const width = $canvas.width
  const height = $canvas.height
  const imageData = ctx.getImageData(0, 0, width, height)
  const result = new ImageData(width, height)
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const r = convolve(getMatrix(imageData.data, i, width, j, 0))
      result.data[(i * width + j) * 4 + 0] = r
      const g = convolve(getMatrix(imageData.data, i, width, j, 1))
      result.data[(i * width + j) * 4 + 1] = g
      const b = convolve(getMatrix(imageData.data, i, width, j, 2))
      result.data[(i * width + j) * 4 + 2] = b
      result.data[(i * width + j) * 4 + 3] = imageData.data[(i * width + j) * 4 + 3]
    }
  }
  // for (let i = 0; i < imageData.data.length; i++) {
  //   result.data[i] = imageData.data[i]
  // }
  console.log('sharping end')
  console.log(`${performance.now() - start}ms`)
  // console.log(result)
  ctx.putImageData(result, 0, 0)
}

const convolve = (matrix: Uint8Array) => {
  const res = kernel.reduce((acc, cur, i) => acc + cur * matrix[i], 0)
  if (res > 256) {
    return 255
  } else if (res < 0) {
    return 0
  } else {
    return res
  }
}

const getEle = (data: Uint8ClampedArray, width: number, suffix: number, row: number, col: number) => {
  if (row >= 0 && col >= 0) {
    return data[(row * width + col) * 4 + suffix]
  }
  return 0
}
const getMatrix = (data: Uint8ClampedArray, i: number, width: number, j: number, suffix: number) => {
  const uint8 = new Uint8Array(9)
  uint8[0] = getEle(data, width, suffix, i - 1, j - 1)
  uint8[1] = getEle(data, width, suffix, i - 1, j)
  uint8[2] = getEle(data, width, suffix, i - 1, j + 1)
  uint8[3] = getEle(data, width, suffix, i    , j - 1)
  uint8[4] = getEle(data, width, suffix, i    , j)
  uint8[5] = getEle(data, width, suffix, i    , j + 1)
  uint8[6] = getEle(data, width, suffix, i + 1, j - 1)
  uint8[7] = getEle(data, width, suffix, i + 1, j)
  uint8[8] = getEle(data, width, suffix, i + 1, j + 1)
  return uint8
  // return [
  //   getEle(data, width, suffix, i - 1, j - 1), getEle(data, width, suffix, i - 1, j), getEle(data, width, suffix, i - 1, j + 1),
  //   getEle(data, width, suffix, i    , j - 1), getEle(data, width, suffix, i    , j), getEle(data, width, suffix, i    , j + 1),
  //   getEle(data, width, suffix, i + 1, j - 1), getEle(data, width, suffix, i + 1, j), getEle(data, width, suffix, i + 1, j + 1)
  // ]
}

