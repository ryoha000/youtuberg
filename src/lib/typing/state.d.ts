import { End, Enque } from './message'

export interface State {
  isInitialised: boolean,
  nowhref: string,
  time: number,
  $canvas: HTMLCanvasElement | null,
  $overlayCanvas: HTMLCanvasElement | null,
  $video: HTMLVideoElement | null,
  $overlayVideo: HTMLVideoElement | null,
  $originalVideo: HTMLVideoElement | null,
  player: YT.Player | null,
  overlayPlayer: YT.Player | null,
  diffs: { time: number, diff: number }[],
  vnDatas: VNData[],
  observer: ResizeObserver | null,
  enque: (_: Enque) => void,
  sendEndToAllWorker: (_: End) => void,
}

export interface VNData { time: number, isSelifEnd: boolean }
