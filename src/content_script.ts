import { captureVideoToCanvas, setupCanvas } from './lib/canvas'
import { End, Enque } from './lib/typing/message';
import { isChange } from './lib/vn';
import useWorker from './use/worker'
import { getPlayerVideoElement, getVideoElement, hidePlayer, setupPlayer } from './lib/youtube';
import { PLAYER_HEIGHT, PLAYER_ID, PLAYER_WIDTH } from './use/const';
import { State } from './lib/typing/state';

declare var scriptUrl: string

const state: State = {
  isInitialised: false,
  nowhref: '',
  time: 0,
  $canvas: null,
  $video: null, 
  $originalVideo: null,
  player: null,
  diffs: [],
  changes: [],
  enque: (_: Enque) => {},
  sendToAllWorker: (_: End) => {},
}

const boot = async () => {
  if (!state.isInitialised) {
    console.log('set promises')
    const promises = [
      new Promise<void>(async resolve => {
        eval(await fetch('https://www.youtube.com/player_api').then(v => v.text()))
        eval(await fetch(scriptUrl).then(v => v.text()))
        resolve()
      }),
      new Promise<void>(async resolve => {
        const { setupWorkers } = useWorker(state)
        await setupWorkers()
        resolve()
      })
    ]
    await Promise.all(promises)
    state.isInitialised = true
  }

  state.player = await setupPlayer(PLAYER_ID, PLAYER_WIDTH, PLAYER_HEIGHT)

  state.player.playVideo()
  state.$originalVideo = getVideoElement()
  state.$video = getPlayerVideoElement(PLAYER_ID)
  const PLAY_BACK_RATE = 3

  state.$video.addEventListener('loadedmetadata', async () => {
    if (!state.$video) return
    state.$video.playbackRate = PLAY_BACK_RATE
    state.player?.seekTo(0, true)

    const rect = state.$video.getBoundingClientRect()
    state.$canvas = setupCanvas(rect.width, rect.height)
    hidePlayer(PLAYER_ID)
    state.$canvas.getContext('2d')!.filter = 'grayscale(1)'

    const side = Math.floor(rect.width / 50)
    const cols = Math.ceil(rect.width / side)
    const data = new Uint8Array(rect.width * rect.height)

    while (true) {
      try {
        state.player?.pauseVideo()

        if (state.time > state.$video.currentTime) {
          break
        }
        state.time = state.$video.currentTime
        captureVideoToCanvas(state.$video, state.$canvas, data, rect.width, rect.height)
        const d = Array.from(data)
        state.enque({ type: 'enque', data: d, width: rect.width, height: rect.height, cols, side, time: state.time })
        
        state.player?.playVideo()
        await new Promise(resolve => setTimeout(resolve, 1))
      } catch (e) { console.error(e) }
    }
    setTimeout(() => {
      state.sendToAllWorker({ type: 'end' })
      console.log(JSON.stringify(state.diffs))
      for (const index of state.changes) {
        console.log(state.diffs[index])
      }
    }, 1000);
  }, { once: true })
}

try {
  state.nowhref = location.href
  boot()
} catch (e) {
  console.warn(e)
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (state.$originalVideo) {
      const nowTime = state.$originalVideo.currentTime
      for (const index of state.changes) {
        if (state.diffs[index].time > nowTime) {
          state.$originalVideo.currentTime = state.diffs[index].time - 0.25
          console.log(`to ${state.diffs[index].time} from ${nowTime}`)
          break
        }
      }
    }
  }
})

setInterval(() => {
  if (state.nowhref !== location.href) {
    state.nowhref = location.href
    state.sendToAllWorker({ type: 'end' })
    try {
      try {
        if (state.isInitialised) {
          state.diffs.splice(0, state.diffs.length)
          state.player?.destroy()
          state.$canvas?.remove()
        }
      } catch {}
      boot()
    } catch (e) {
      console.warn(e)
    }
  }
}, 500)
