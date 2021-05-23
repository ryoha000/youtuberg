import {  captureVideoToCanvas, setFrameToArray } from "./canvas"
import { State } from "./typing/state"

interface VNData {
  time: number,
  isSelifEnd: boolean
}

const THRESHOLD = 10
const MIN_INDEX_WINDOW = 1

// TODO: 仕様に、前のセリフ部分が長い時閾値を上げる、を追加する
/**
 * 仕様\
 * 後ろから3番目が変化点かどうかを調べる\
 * 0が二つ以上並んでるときに状態が変わったとみなす\
 * 二つ以上の0に囲われる囲まれる**一つの**0より大きい値は状態が変わったとはみなさない\
 * 連続した0より大きい値でもその連続すべてが10より小さい場合は状態が変わったとはみなさない\
 * e.g. 0,0,11,0,0 は状態が1つ 0,0,11,11,0,0 は状態が3つ 0,0,8,8,0,0 は状態が1つ\
 * 二つ以上の0が並んだ部分の開始時点がセリフ終了時とみなす
 * @param diffs 
 * @returns 
 */
export const checkChangeThirdFromBack = (diffs: { time: number, diff: number }[]): VNData | void => {
  const SHORTEST_ZEROS = 2
  const THRESHOLD = 10
  const targetIndex = diffs.length - SHORTEST_ZEROS - 1
  if (targetIndex < 1) {
    return
  }
  // 注目してる要素が0
  if (diffs[targetIndex].diff === 0) {
    // ただ突発的に出てきた孤立している0
    if (diffs[targetIndex - 1].diff !== 0 && diffs[targetIndex + 1].diff !== 0) {
      return
    }
    // 前の0の塊の続き
    if (diffs[targetIndex - 1].diff === 0) {
      return
    }
    {
      // 前にある0より大きい塊の全要素が閾値以下の場合
      let isOver = false
      for (let i = targetIndex - 1; i >= 0; i--) {
        if (diffs[i].diff === 0) {
          // 0の塊の続きだった！
          return
        }
        if (diffs[i].diff > THRESHOLD) {
          // 閾値を超えてるチェックフラグを立たせる
          isOver = true
        }
        if (isOver && targetIndex - i > 1) {
          // 前にあるのは無視できない0より大きい値の塊だった！！
          break
        }
      }
    }
    // 0の塊の始まり
    if (diffs[targetIndex + 1].diff === 0) {
      return { time: diffs[targetIndex].time, isSelifEnd: true }
    }
    console.warn('unreach code', diffs, targetIndex)
  }
  // 注目してる要素が0じゃないとき
  // ただ突発的に出てきた孤立している0でない値
  if (diffs[targetIndex - 2].diff === 0 && diffs[targetIndex - 1].diff === 0 && diffs[targetIndex + 1].diff === 0 && diffs[targetIndex + 2].diff === 0) {
    return
  }
  // 0でない塊の始まりなら(閾値以上の要素がある場合)後ろで挿入するためスキップ
  if (diffs[targetIndex - 2].diff === 0 && diffs[targetIndex - 1].diff === 0 && diffs[targetIndex + 1].diff !== 0) {
    return
  }
  // この値が閾値より大きい時
  if (diffs[targetIndex].diff > THRESHOLD) {
    // 始まりの要素以外で閾値より大きいのものがあるなら追加しない
    // 注目してる要素のひとつ前を起点に後ろから探索
    let isOver = false
    let zeroCount = 0
    for (let i = targetIndex - 1; i >= 0; i--) {
      // すでにこの塊が追加されてるとき
      if (isOver && diffs[i].diff > 0) {
        return
      }
      // 閾値を超えている要素があったとき
      if (diffs[i].diff > THRESHOLD && i !== THRESHOLD) {
        isOver = true
      }
      // 塊の外のとき
      if (diffs[i].diff === 0) {
        zeroCount++
        // 0が連続してないならスキップ
        if (zeroCount === 1) {
          continue
        }
        // 始まりの要素が閾値を超えているとき
        if (isOver) {
          // 対象の要素が、始まりの要素の次の要素の時
          if ((i + zeroCount) + 1 === targetIndex) {
            return { time: diffs[i + zeroCount].time, isSelifEnd: false }
          }
          // 始まりの要素の次の要素が0で、対象の要素がその次だった時
          if ((i + zeroCount) + 2 === targetIndex && diffs[(i + zeroCount) + 1].diff === 0) {
            return { time: diffs[i + zeroCount].time, isSelifEnd: false }
          }
          return
        } else {
          return { time: diffs[i + zeroCount].time, isSelifEnd: false }
        }
      } else {
        zeroCount = 0
      }
    }
  } else {
    // 対象の要素が閾値を超えていなくても
    // 最初の要素が閾値を超えていて、対象の要素が孤立している0を飛ばしてその次の要素だった場合追加する
    if (diffs[targetIndex - 1].diff > THRESHOLD) {
      return { time: diffs[targetIndex - 1].time, isSelifEnd: false }
    }
    if (diffs[targetIndex - 2].diff > THRESHOLD && diffs[targetIndex - 2].diff === 0) {
      return { time: diffs[targetIndex - 2].time, isSelifEnd: false }
    }
    return
  }
  console.warn('unreach code', diffs, targetIndex)
}

// TODO: これじゃなくて上で書いてるようなインクリメンタルなパースをする
export const tempCheck = (diffs: { time: number, diff: number }[]): VNData[] => {
  if (diffs.length === 0) return []
  diffs.sort((a, b) => a.time - b.time)
  const res: VNData[] = []
  let isOver = false
  let isZeroZone = false
  let lastZeroIndex = -1
  let zeroCount = 0
  let firstNotZeroIndex = -1
  let lastSelifStartTime = diffs[0].time
  let lastSelifTime = 0
  let lastOverIndex = -1
  for (let i = 0; i < diffs.length; i++) {
    if (diffs[i].diff === 0) {
      if (!isZeroZone && lastZeroIndex === i - 1 && lastZeroIndex !== -1) {
        isZeroZone = true
        isOver = false
        lastSelifTime = diffs[lastZeroIndex].time - lastSelifStartTime
        res.push({ time: diffs[lastZeroIndex].time, isSelifEnd: true })
      }
      if (lastZeroIndex === i - 1) {
        isOver = false
        firstNotZeroIndex = -1
      }
      lastZeroIndex = i
      zeroCount++
    }
    if (diffs[i].diff > 0) {
      if (isZeroZone && isOver) {
        isZeroZone = false
        lastSelifStartTime = diffs[firstNotZeroIndex].time
        res.push({ time: diffs[firstNotZeroIndex].time, isSelifEnd: false })
      }
      if (firstNotZeroIndex === -1) {
        firstNotZeroIndex = i
      }
    }
    // TODO: 仕様に追記する
    // if (!isZeroZone && lastOverIndex < i - 5) {
    //   isZeroZone = true
    //   isOver = false
    //   res.push({ time: diffs[lastOverIndex + 1].time, isSelifEnd: true })
    // }
    // TODO: 仕様に追記する
    // if (diffs[i].diff > Math.max(THRESHOLD, THRESHOLD * (lastSelifTime + 1))) {
    //   isOver = true
    // }
    if (diffs[i].diff > THRESHOLD) {
      isOver = true
    }
    if (diffs[i].diff > THRESHOLD) {
      lastOverIndex = i
    }
  }
  return res
}

export const isChange = (diffs: { time: number, diff: number }[]) => {
  if (diffs.length < MIN_INDEX_WINDOW * 2 + 1) {
    return -1
  }
  if (diffs[diffs.length - MIN_INDEX_WINDOW - 1].diff < THRESHOLD) {
    return -1
  }
  for (let i = diffs.length - 1 - (MIN_INDEX_WINDOW * 2); i < diffs.length; i++) {
    if (i === diffs.length - 1 - MIN_INDEX_WINDOW) continue
    if (diffs[i].diff + THRESHOLD > diffs[diffs.length - 1 - MIN_INDEX_WINDOW].diff) {
      if (i === diffs.length - 2 - MIN_INDEX_WINDOW && diffs.length >= MIN_INDEX_WINDOW * 2 && Math.abs(diffs[i].diff - diffs[diffs.length - 1 - MIN_INDEX_WINDOW].diff) < THRESHOLD) {
        if (diffs[diffs.length - 2 - (MIN_INDEX_WINDOW * 2)].diff < THRESHOLD) {
          continue
        }
      }
      return -1
    }
  }
  return diffs.length - 1 - MIN_INDEX_WINDOW
}

export const setupControl = (state: State) => {
  let lastSkipIndex = -1
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (state.$originalVideo && state.$overlayCanvas && state.$overlayVideo && state.overlayPlayer) {
        const nowTime = state.$originalVideo.currentTime
        for (let i = 0; i < state.vnDatas.length - 1; i++) {
          if (state.vnDatas[i].time > nowTime) {
            if (lastSkipIndex === i) {
              state.$originalVideo.currentTime = state.vnDatas[i].time - 0.1
              state.$overlayCanvas.style.display = 'none'
              console.log(`to ${state.vnDatas[i].time} from ${nowTime}`)
              break
            }
            if (state.vnDatas[i].isSelifEnd) {
              const isPosed = state.$overlayVideo.paused
              if (!isPosed) {
                state.overlayPlayer.pauseVideo()
              }
              const tmpTime = state.overlayPlayer.getCurrentTime()
              state.$overlayVideo.addEventListener('seeked', () => {
                if (state.$originalVideo && state.$overlayCanvas && state.$overlayVideo && state.overlayPlayer) {
                  captureVideoToCanvas(state.$overlayVideo, state.$overlayCanvas)
                  state.$overlayCanvas.style.display = 'block'
                  lastSkipIndex = i
                  const waitTime = state.vnDatas[i + 1].time - nowTime
                  console.log(`to ${state.vnDatas[i].time} from ${nowTime} selifend ${waitTime}`)
                  setTimeout(() => {
                    if (state.$overlayCanvas && state.$originalVideo) {
                      console.log('fire settimeout', state.$originalVideo.currentTime)
                      if (lastSkipIndex === i) {
                        state.$overlayCanvas.style.display = 'none'
                      }
                    }
                  }, waitTime * 1000);
                  state.overlayPlayer.seekTo(tmpTime, true)
                  if (!isPosed) {
                    state.$overlayVideo.addEventListener('seeked', () => {
                      if (state.overlayPlayer) {
                        state.overlayPlayer.playVideo()
                      }
                    }, { once: true })
                  }
                }
              }, { once: true })
              state.overlayPlayer.seekTo(state.vnDatas[i].time, true)
            } else {
              state.$originalVideo.currentTime = state.vnDatas[i].time - 0.1
              state.$overlayCanvas.style.display = 'none'
              console.log(`to ${state.vnDatas[i].time} from ${nowTime}`)
            }
            break
          }
        }
      }
    }
  })
}
