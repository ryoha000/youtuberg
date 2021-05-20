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

export const trackingOriginalVideo = ($video: HTMLVideoElement, playerId: string) => {
  const player = document.getElementById(playerId)
  if (!player) throw 'there no iframe'
  player.addEventListener('click', (e) => e.stopPropagation())
  const resizeObserver = new ResizeObserver(entries => {
    player.style.top = `${entries[0].contentRect.top}px`
    player.style.left = `${entries[0].contentRect.left}px`
    player.style.width = `${entries[0].contentRect.width}px`
    player.style.height = `${entries[0].contentRect.height}px`
  })
  resizeObserver.observe($video)
  return resizeObserver
}

export const getVideoElement = () => {
  const $videos = document.getElementsByTagName('video')
  if ($videos.length === 0) {
    throw 'video element not found'
  }
  return $videos[0]
}
