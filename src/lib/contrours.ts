export const findControursFromBinary = (
  src: boolean[],
  rows: number,
  cols: number,
  labels: number[],
  contrours: number[],
  areas: number[],
  sizes: { rows: number, cols: number }[]
) => {
  let groupId = 0

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

  for (let i = 0; i < src.length; i++) {
    // もう、このマスに関係するGroupが探索されてたらスキップ
    if (labels[i] === 0 || labels[i]) continue

    const value = src[i]
    labels[i] = groupId
    let toCheckIndexes = getAroundBlockIndexes(i)

    let area = 1
    const col = i % cols
    let minCol = col
    let maxCol = col
    let minIndex = i
    let maxIndex = i

    while (true) {
      if (toCheckIndexes.length === 0) break
      const newToCheckIndexes: number[] = []
      // 上下左右で閾値を超えているものがあるか探索
      for (let j = 0; j < toCheckIndexes.length; j++) {
        if (labels[toCheckIndexes[j]] === 0 || labels[toCheckIndexes[j]]) continue

        if (src[toCheckIndexes[j]] !== value) continue
        labels[toCheckIndexes[j]] = groupId

        const col = toCheckIndexes[j] % cols
        if (maxCol < col) maxCol = col
        if (minCol > col) minCol = col
        if (minIndex > toCheckIndexes[j]) minIndex = toCheckIndexes[j]
        if (maxIndex < toCheckIndexes[j]) maxIndex = toCheckIndexes[j]

        newToCheckIndexes.push(...getAroundBlockIndexes(toCheckIndexes[j]))
        area++
      }
      toCheckIndexes = newToCheckIndexes
    }
    areas.push(area)
    sizes.push({ rows: Math.floor(maxIndex / cols) - Math.floor(minIndex / cols) + 1, cols: maxCol - minCol + 1 })
    groupId += 1
  }

  setControursFromLabels()
}
