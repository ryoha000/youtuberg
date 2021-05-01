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
  ctx.drawImage($video, 0, 0, $canvas.width, $canvas.height)
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

export const drawGroups = (data: Uint8ClampedArray, groupedLabels: number[], width: number, height: number, cols: number, side: number, ignoreGroupIds: number[]) => {
  const groupIdColor: [number, number, number][] = []
  function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }
  for (let i = 0; i < groupedLabels.length; i++) {
    if (ignoreGroupIds.includes(groupedLabels[i])) continue
    if (!groupIdColor[groupedLabels[i]]) {
      const r = getRandomInt(255)
      const g = getRandomInt(255)
      const b = getRandomInt(255)
      groupIdColor[groupedLabels[i]] = [r, g, b]
    }
    const [r, g, b] = groupIdColor[groupedLabels[i]]
    const row = Math.floor(i / cols)
    const col = i % cols
    for (let k = row * side; k < Math.min((row + 1) * side, height); k++) {
      for (let l = col * side; l < Math.min((col + 1) * side, width); l++) {
        data[(k * width + l) * 4 + 0] = r
        data[(k * width + l) * 4 + 1] = g
        data[(k * width + l) * 4 + 2] = b
        data[(k * width + l) * 4 + 3] = 255
      }
    }
  }
}
