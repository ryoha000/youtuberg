export const setupCanvas = () => {
  const $canvas = document.createElement('canvas')
  document.getElementsByTagName('ytd-app')[0].appendChild($canvas)
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
