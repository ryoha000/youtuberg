import {  setFrameToArray, setupCanvas } from './lib/canvas'
import { CompareResult, End, Enque } from './lib/typing/message';
import { isChange, setupControl, tempCheck } from './lib/vn';
import useWorker from './use/worker'
import { getPlayerVideoElement, getVideoElement, hidePlayer, setupOverlayCanvas, setupPlayer } from './lib/youtube';
import { PLAYER_HEIGHT, PLAYER_ID, PLAYER_WIDTH, OVERLAY_PLAYER_ID } from './use/const';
import { State } from './lib/typing/state';

declare var scriptUrl: string

const activate = () => {
  const state: State = {
    isInitialised: false,
    nowhref: '',
    time: 0,
    $canvas: null,
    $overlayCanvas: null,
    $video: null, 
    overlayPlayer: null,
    $overlayVideo: null,
    $originalVideo: null,
    player: null,
    diffs: [],
    vnDatas: [],
    observer: null,
    enque: (_: Enque) => {},
    sendEndToAllWorker: (_: End) => {},
  }
  
  const reset = () => {
    state.$canvas?.remove()
    state.$overlayCanvas?.remove()
    state.$video = null
    state.$overlayVideo = null
    state.$originalVideo = null
    state.player?.destroy()
    state.overlayPlayer?.destroy()
    state.diffs.splice(0, state.diffs.length)
    state.vnDatas.splice(0, state.vnDatas.length)
    state.observer?.disconnect()
    state.time = 0
  }
  
  let count = 0
  const compareCallBack = (msg: CompareResult) => {
    state.diffs.push({ time: msg.time, diff: msg.result })
    // const vnData = checkChangeThirdFromBack(state.diffs)
    // if (vnData) {
    //   state.vnDatas.push(vnData)
    // }
    count++
    if (count > 10) {
      state.vnDatas = tempCheck(state.diffs)
      count = 0
    }
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
          const { setupWorkers } = useWorker(state, compareCallBack)
          await setupWorkers()
          resolve()
        })
      ]
      await Promise.all(promises)
      state.isInitialised = true
    }
  
    const [p, op] = await Promise.all([
      setupPlayer(PLAYER_ID, PLAYER_WIDTH, PLAYER_HEIGHT),
      setupPlayer(OVERLAY_PLAYER_ID, PLAYER_WIDTH, PLAYER_HEIGHT)
    ])
    state.player = p
    state.overlayPlayer = op
  
    state.player.playVideo()
    state.overlayPlayer.playVideo()
    state.$originalVideo = getVideoElement()
    state.$video = getPlayerVideoElement(PLAYER_ID)
    state.$overlayVideo = getPlayerVideoElement(OVERLAY_PLAYER_ID)
    const PLAY_BACK_RATE = 3
  
    state.$video.addEventListener('loadedmetadata', async () => {
      if (!state.$video) return
      state.$video.playbackRate = PLAY_BACK_RATE
      state.player?.seekTo(0, true)
  
      const rect = state.$video.getBoundingClientRect()
      state.$canvas = setupCanvas(rect.width, rect.height)
      const oc = setupOverlayCanvas(state)
      if (oc) {
        state.$overlayCanvas = oc.$overlayCanvas
        state.observer = oc.resizeObserver
      }
      hidePlayer(PLAYER_ID)
      hidePlayer(OVERLAY_PLAYER_ID)
      state.player?.mute()
      state.overlayPlayer?.mute()
      state.$canvas.getContext('2d')!.filter = 'grayscale(1) contrast(1000%)'
  
      const side = Math.floor(rect.width / 50)
      const cols = Math.ceil(rect.width / side)
      const data = []
      for (let _i = 0; _i < rect.width * rect.height; _i++) {
        data.push(0)
      }
  
      while (true) {
        try {
          state.player?.pauseVideo()
  
          if (state.time > state.$video.currentTime) {
            break
          }
          state.time = state.$video.currentTime
          setFrameToArray(state.$video, state.$canvas, data, rect.width, rect.height)
          state.enque({ type: 'enque', data, width: rect.width, height: rect.height, cols, side, time: state.time })
          
          state.player?.playVideo()
          await new Promise(resolve => setTimeout(resolve, 1))
        } catch (e) { console.error(e) }
      }
      setTimeout(() => {
        state.sendEndToAllWorker({ type: 'end' })
        console.log(JSON.stringify(state.diffs))
        for (const vnData of state.vnDatas) {
          console.log(vnData)
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
  
  setupControl(state)
  
  setInterval(() => {
    if (state.nowhref !== location.href) {
      state.nowhref = location.href
      state.sendEndToAllWorker({ type: 'end' })
      try {
        reset()
        boot()
      } catch (e) { console.warn(e) }
    }
  }, 500)
}

let isActivate = false
// @ts-ignore
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('req', request)
  if (request == "activate" && !isActivate) {
    isActivate = true
    activate();
  }
});
