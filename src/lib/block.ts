import { UserOption } from "./typing/option"

export const getSide = (width: number, option?: UserOption) => {
  const ratio = option?.sideRatio ?? 0.030
  return  Math.ceil(width * ratio)
}

export const getScores = (data: Uint8ClampedArray, width: number, height: number, rows: number, cols: number, side: number): number[] => {
  const result = new Array(rows * cols)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let score = 0
      for (let k = row * side; k < Math.min((row + 1) * side, height); k++) {
        for (let l = col * side; l < Math.min((col + 1) * side, width); l++) {
          if (data[(k * width + l) * 4 + 0] === 255 &&
            data[(k * width + l) * 4 + 1] === 255 &&
            data[(k * width + l) * 4 + 2] === 255 &&
            data[(k * width + l) * 4 + 3] === 255
          ) {
            score++
          }
        }
      }
      result[row * cols + col] = score
    }
  }
  return result
}

const getLongestLabelId = (contrours: number[], cols: number, direction: 'rows' | 'cols' = 'cols') => {
  // top, bottomはただ最小、最大のindexをいれてるだけ
  const datas: { left: number, right: number, top: number, bottom: number }[] = []
  for (let i = 0; i < contrours.length; i++) {
    if (contrours[i] === 0) continue
    if (!datas[contrours[i]]) {
      datas[contrours[i]] = { left: i % cols, right: i % cols, top: i, bottom: i }
      continue
    }
    if (datas[contrours[i]].left > i % cols) datas[contrours[i]].left = i % cols
    if (datas[contrours[i]].right < i % cols) datas[contrours[i]].right = i % cols
    if (datas[contrours[i]].top > i) datas[contrours[i]].top = i
    if (datas[contrours[i]].bottom < i) datas[contrours[i]].bottom = i
  }
  if (datas.length === 0) {
    throw 'there no group'
  }

  let longest = -1
  let longestId = 0
  if (direction === 'cols') {
    for (let i = 0; i < datas.length; i++) {
      const diff = datas[i].right - datas[i].left
      if (longest < diff) {
        longest = diff
        longestId = i
      }
    }
  }
  if (direction === 'rows') {
    for (let i = 0; i < datas.length; i++) {
      const diff = Math.floor((datas[i].bottom - datas[i].top) / cols)
      if (longest < diff) {
        longest = diff
        longestId = i
      }
    }
  }
  return longestId
}

export const getMergedContrours = (labels: number[], contrours: number[], cols: number) => {
  for (let i = 0; i < labels.length; i++) {
    if (contrours[i] === 0) continue
    /**
     * ○○●○●○○
     * ●●○○○●●
     * ○○●○●○○
     * ●部分を探索
     */
    const groupId = labels[i]
    if (labels[i - cols - 1] && labels[i - cols - 1] !== groupId) {
      updateContrours(labels, contrours, groupId, labels[i - cols - 1], i - 1, i - cols)
    }
    if (labels[i - cols + 1] && labels[i - cols + 1] !== groupId) {
      updateContrours(labels, contrours, groupId, labels[i - cols + 1], i + 1, i - cols)
    }
    if (labels[i - 3] && labels[i - 3] !== groupId) {
      updateContrours(labels, contrours, groupId, labels[i - 3], i - 1, i - 2)
    }
    if (labels[i - 2] && labels[i - 2] !== groupId) {
      updateContrours(labels, contrours, groupId, labels[i - 2], i - 1)
    }
    if (labels[i + 2] && labels[i + 2] !== groupId) {
      updateContrours(labels, contrours, groupId, labels[i + 2], i + 1)
    }
    if (labels[i + 3] && labels[i + 3] !== groupId) {
      updateContrours(labels, contrours, groupId, labels[i + 3], i + 1, i + 2)
    }
    if (labels[i + cols - 1] && labels[i + cols - 1] !== groupId) {
      updateContrours(labels, contrours, groupId, labels[i + cols - 1], i - 1, i + cols)
    }
    if (labels[i + cols + 1] && labels[i + cols + 1] !== groupId) {
      updateContrours(labels, contrours, groupId, labels[i + cols + 1], i + 1, i + cols)
    }
  }
}

const updateContrours = (labels: number[], contrours: number[], groupId: number, beforeGroupId: number, ...buriedIndexes: number[]) => {
  for (let j = 0; j < labels.length; j++) {
    if (labels[j] === beforeGroupId) {
      labels[j] = groupId
    }
    for (let i = 0; i < buriedIndexes.length; i++) {
      if (j === buriedIndexes[i]) {
        labels[j] = groupId
        contrours[j] = 1
      }
    }
  }
}

export const fillMissingBlock = (labels: number[], rows: number, cols: number) => {
  const MAX_DIFF = 3
  for (let row = 0; row < rows; row++) {
    let lastFilledCol = cols
    let lastFilledGroup = -1
    for (let col = 0; col < cols; col++) {
      if (labels[row * cols + col] !== 0) {
        if (col - lastFilledCol - 1 > 0 && col - lastFilledCol - 1 <= MAX_DIFF && lastFilledGroup === labels[row * cols + col]) {
          for (let i = row * cols + lastFilledCol + 1; i < row * cols + col; i ++) {
            labels[i] = lastFilledGroup
          }
        }
        lastFilledGroup = labels[row * cols + col]
        lastFilledCol = col
      }
    }
  }
}
