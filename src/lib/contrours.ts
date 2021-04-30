export const findContrours = (scores: number[], rows: number, cols: number, labels: number[], contrours: number[], minThreshold: number, maxThreshold: number) => {
  let groupId = 1

  // 周囲の有効なBlockのindexをとってくる関数
  const getAroundBlockIndexes = (index: number) => {
    const result = []
    const top = index - cols
    const bottom = index + cols
    const left = index - 1
    const right = index + 1

    // ちゃんとindex内にあるかチェック
    if (top >= 0) result.push(top)
    if (bottom < rows * cols) result.push(bottom)
    if (left % cols !== 0 && left >= 0) result.push(left)
    if (right % cols !== 0 && right < rows * cols) result.push(right)
    return result
  }

  for (let i = 0; i < scores.length; i++) {
    // もう、このマスに関係するGroupが探索されてたらスキップ
    if (labels[i] === 0 || labels[i]) continue
    labels[i] = 0

    if (scores[i] < minThreshold || scores[i] > maxThreshold) continue

    // 閾値以上の時
    labels[i] = groupId
    let toCheckIndexes = getAroundBlockIndexes(i)

    while (true) {
      if (toCheckIndexes.length === 0) break
      const newToCheckIndexes: number[] = []
      // 上下左右で閾値を超えているものがあるか探索
      for (let j = 0; j < toCheckIndexes.length; j++) {
        if (labels[toCheckIndexes[j]] === 0 || labels[toCheckIndexes[j]]) continue
        labels[toCheckIndexes[j]] = 0

        if (scores[toCheckIndexes[j]] < minThreshold || scores[toCheckIndexes[j]] > maxThreshold) continue
        labels[toCheckIndexes[j]] = groupId
        newToCheckIndexes.push(...getAroundBlockIndexes(toCheckIndexes[j]))
      }
      toCheckIndexes = newToCheckIndexes
    }
    groupId += 1
  }

  for (let i = 0; i < labels.length; i++) {
    contrours[i] = 0
    if (labels[i] === 0) continue
    const indexes = getAroundBlockIndexes(i)
    if (indexes.length !== 4) {
      contrours[i] = 1
    }
    let isEdge = false
    for (let j = 0; j < indexes.length; j++) {
      if (labels[indexes[j]] === 0) {
        isEdge = true
        break
      }
    }
    if (isEdge) {
      contrours[i] = 1
    }
  }
}

export const findControursBinary = (scores: boolean[], rows: number, cols: number, labels: number[], contrours: number[]) => {
  let groupId = 1

  // 周囲の有効なBlockのindexをとってくる関数
  const getAroundBlockIndexes = (index: number) => {
    const result = []
    const top = index - cols
    const bottom = index + cols
    const left = index - 1
    const right = index + 1

    // ちゃんとindex内にあるかチェック
    if (top >= 0) result.push(top)
    if (bottom < rows * cols) result.push(bottom)
    if (left % cols !== 0 && left >= 0) result.push(left)
    if (right % cols !== 0 && right < rows * cols) result.push(right)
    return result
  }

  for (let i = 0; i < scores.length; i++) {
    // もう、このマスに関係するGroupが探索されてたらスキップ
    if (labels[i]) continue
    const value = scores[i]

    labels[i] = groupId
    let toCheckIndexes = getAroundBlockIndexes(i)

    while (true) {
      if (toCheckIndexes.length === 0) break
      const newToCheckIndexes: number[] = []
      // 上下左右で閾値を超えているものがあるか探索
      for (let j = 0; j < toCheckIndexes.length; j++) {
        if (labels[toCheckIndexes[j]]) continue

        if (scores[toCheckIndexes[j]] !== value) continue
        labels[toCheckIndexes[j]] = groupId
        newToCheckIndexes.push(...getAroundBlockIndexes(toCheckIndexes[j]))
      }
      toCheckIndexes = newToCheckIndexes
    }
    groupId += 1
  }

  for (let i = 0; i < labels.length; i++) {
    contrours[i] = 0
    if (labels[i] === 0) continue
    const indexes = getAroundBlockIndexes(i)
    if (indexes.length !== 4) {
      contrours[i] = 1
    }
    let isEdge = false
    for (let j = 0; j < indexes.length; j++) {
      if (labels[indexes[j]] === 0) {
        isEdge = true
        break
      }
    }
    if (isEdge) {
      contrours[i] = 1
    }
  }
}
