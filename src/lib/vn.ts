interface VNData {
  time: number
}

const THRESHOLD = 10
const MIN_INDEX_WINDOW = 1

export const isChange = (diffs: { time: number, diff: number }[]) => {
  if (diffs.length < MIN_INDEX_WINDOW * 2 + 1) {
    return -1
  }
  if (diffs[diffs.length - MIN_INDEX_WINDOW - 1].diff < THRESHOLD) {
    return -1
  }
  for (let i = diffs.length - 1 - (MIN_INDEX_WINDOW * 2); i < diffs.length; i++) {
    if (i === diffs.length - 1 - MIN_INDEX_WINDOW) continue
    if (diffs[i].diff > THRESHOLD) {
      return -1
    }
  }
  return diffs.length - 1 - MIN_INDEX_WINDOW
}
