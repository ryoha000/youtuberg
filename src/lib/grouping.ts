export const findControursFromBinary = (scores: boolean[], rows: number, cols: number, labels: number[], contrours: number[], areas: number[]) => {
  let groupId = 0
  labels = new Array(rows * cols)
  contrours = new Array(rows * cols)
  areas = []

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

  const setControursFromLabels = () => {
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

  let maxCols = 0
  for (let i = 0; i < scores.length; i++) {
    // もう、このマスに関係するGroupが探索されてたらスキップ
    if (labels[i] !== 0 && labels[i]) continue
    const value = scores[i]

    labels[i] = groupId
    let toCheckIndexes = getAroundBlockIndexes(i)

    let area = 1
    const col = i % cols
    let minCol = col
    let maxCol = col

    while (true) {
      if (toCheckIndexes.length === 0) break
      const newToCheckIndexes: number[] = []
      // 上下左右で閾値を超えているものがあるか探索
      for (let j = 0; j < toCheckIndexes.length; j++) {
        if (labels[i] !== 0 && labels[toCheckIndexes[j]]) continue

        if (scores[toCheckIndexes[j]] !== value) continue
        labels[toCheckIndexes[j]] = groupId

        const col = toCheckIndexes[j] / cols
        if (maxCol < col) maxCol = col
        if (minCol > col) minCol = col

        newToCheckIndexes.push(...getAroundBlockIndexes(toCheckIndexes[j]))
        area++
      }
      toCheckIndexes = newToCheckIndexes
    }
    areas.push(area)
    if (maxCols < maxCol - minCol + 1) {
      maxCols = maxCol - minCol + 1
    }
    groupId += 1
  }

  setControursFromLabels()

  return maxCols
}

