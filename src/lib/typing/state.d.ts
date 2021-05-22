import { End, Enque } from './message'

export interface State {
  isInitialised: boolean,
  nowhref: string,
  time: number,
  $canvas: HTMLCanvasElement | null,
  $video: HTMLVideoElement | null,
  $originalVideo: HTMLVideoElement | null,
  player: YT.Player | null,
  diffs: { time: number, diff: number }[],
  changes: number[],
  enque: (_: Enque) => void,
  sendToAllWorker: (_: End) => void,
}
