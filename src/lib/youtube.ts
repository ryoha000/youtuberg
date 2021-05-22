import { captureVideoToCanvas, setupCanvas } from "./canvas"

export const setupPlayer = (playerId: string, width: number, height: number) => {
  return new Promise<YT.Player>(resolve => {
    const div = document.createElement('div')
    div.id = playerId
    document.body.appendChild(div)

    const url = new URL(location.href)
    const id = url.searchParams.get('v')
    if (!id) throw 'there are no video'
    let youtubergPlayer: YT.Player
    youtubergPlayer = new YT.Player(playerId, {
      width: width,
      height: height,
      videoId: id,
      playerVars: { rel: 0, enablejsapi: 1 },
      events: { onReady: () => resolve(youtubergPlayer) }
    })
  })
}

export const getPlayerVideoElement = (id: string) => {
  const player = document.getElementById(id)
  if (!player) throw 'there no iframe'
  const playerDocument = (player as HTMLIFrameElement).contentDocument
  if (!playerDocument) throw 'couldnt get contentDocument'
  const $videos = playerDocument.body.getElementsByTagName('video')
  if ($videos.length === 0) throw 'there are no video in iframe'
  return $videos[0]
}

export const hidePlayer = (id: string) => {
  const player = document.getElementById(id)
  if (!player) throw 'there no iframe'
  player.style.display = 'none'
}

export const setupOverlayCanvas = (state: { $originalVideo: HTMLVideoElement | null }) => {
  if (!state.$originalVideo) return
  const rect = state.$originalVideo.getClientRects()
  const $overlayCanvas = document.createElement('canvas')
  $overlayCanvas.width = rect[0].width
  $overlayCanvas.height = rect[0].height
  const parent = document.getElementById('primary-inner')
  console.log(parent)
  if (parent) {
    parent.appendChild($overlayCanvas)
  }
  $overlayCanvas.addEventListener('click', (e) => e.stopPropagation())
  $overlayCanvas.style.display = 'block'
  $overlayCanvas.style.position = 'absolute'
  setTimeout(() => {
    if (state.$originalVideo) {
      captureVideoToCanvas(state.$originalVideo, $overlayCanvas, new Uint8Array(), rect[0].width, rect[0].height)
    }
  }, 2000);
  const resizeObserver = new ResizeObserver(entries => {
    $overlayCanvas.style.top = `${rect[0].top + entries[0].contentRect.top}px`
    $overlayCanvas.style.left = `${rect[0].left + entries[0].contentRect.left}px`
    $overlayCanvas.width = entries[0].contentRect.width
    $overlayCanvas.height = entries[0].contentRect.height
  })
  resizeObserver.observe(state.$originalVideo)
  return { resizeObserver, $overlayCanvas }
}

export const getVideoElement = () => {
  const $videos = document.getElementsByTagName('video')
  if ($videos.length === 0) {
    throw 'video element not found'
  }
  return $videos[0]
}
