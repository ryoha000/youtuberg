export const setupPlayer = (PLAYER_ID: string, $video: HTMLVideoElement) => {
  return new Promise<YT.Player>(resolve => {
    const rect = $video.getClientRects()[0]
    const div = document.createElement('div')
    div.id = PLAYER_ID
    div.style.cssText = `
    position: absolute;
    background: black;
    object-fit: contain;
    z-index: 10;
    transform: translate(${rect.left}px, ${rect.top}px);
    `
    document.body.appendChild(div)

    const url = new URL(location.href)
    const id = url.searchParams.get('v')
    if (!id) throw 'there are no video'
    let youtubergPlayer: YT.Player
    const setQualityAndResolve = () => {
      const qualities = youtubergPlayer.getAvailableQualityLevels()
      const priority: YT.SuggestedVideoQuality[] = ['highres', 'hd1080', 'hd720', 'large', 'medium', 'small', 'default']
      for (const p of priority) {
        if (qualities.includes(p)) {
          youtubergPlayer.setPlaybackQuality(p)
          break
        }
      }
      resolve(youtubergPlayer)
    }
    youtubergPlayer = new YT.Player(PLAYER_ID, {
      width: rect.width,
      height: rect.height,
      videoId: id,
      playerVars: { rel: 0 },
      events: { onReady: setQualityAndResolve }
    })
  })
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

export const getVideoElement = (playerId: string) => {
  const $videos = document.getElementsByTagName('video')
  if ($videos.length === 0) {
    throw 'video element not found'
  }
  return $videos[0]
}
