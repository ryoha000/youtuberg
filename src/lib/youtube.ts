import {  setFrameToArray, setupCanvas } from "./canvas"

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
  // player.style.display = 'none'
  // player.style.top = '-200px'
  player.style.position = 'absolute'
  player.style.zIndex = '-99'
  // player.style.opacity = '1'
  document.body.style.overflowX = 'hidden'
}

export const setupOverlayCanvas = (state: { $originalVideo: HTMLVideoElement | null }) => {
  if (!state.$originalVideo) return
  const rect = state.$originalVideo.getBoundingClientRect()
  const $overlayCanvas = document.createElement('canvas')
  $overlayCanvas.width = rect.width
  $overlayCanvas.height = rect.height
  $overlayCanvas.style.display = 'none'
  $overlayCanvas.style.position = 'absolute'
  const parent = document.getElementById('primary-inner')
  parent?.appendChild($overlayCanvas)
  $overlayCanvas.addEventListener('click', (e) => e.stopPropagation())

  const resizeObserver = new ResizeObserver(entries => {
    const rect = state.$originalVideo!.getBoundingClientRect()
    $overlayCanvas.style.top = `${rect.top + entries[0].contentRect.top}px`
    $overlayCanvas.style.left = `${rect.left + entries[0].contentRect.left}px`
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
