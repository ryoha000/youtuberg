export const findContrours = (scores: number[], rows: number, cols: number, threshold: number) => {
  const contrours: number[] = new Array(rows * cols)
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

  for (let i = 0; i < rows; i++) {
    // もう、このマスに関係するGroupが探索されてたらスキップ
    if (contrours[i] === 0) continue
    contrours[i] = 0

    if (scores[i] < threshold) continue

    // 閾値以上の時
    contrours[i] = groupId
    let toCheckIndexes = getAroundBlockIndexes(i)

    while (true) {
      if (toCheckIndexes.length === 0) break
      const newToCheckIndexes: number[] = []
      // 上下左右で閾値を超えているものがあるか探索
      for (let j = 0; j < toCheckIndexes.length; j++) {
        if (contrours[toCheckIndexes[j]] === 0) continue
        contrours[toCheckIndexes[j]] = 0

        if (scores[toCheckIndexes[j]] < threshold) continue
        contrours[toCheckIndexes[j]] = groupId
        newToCheckIndexes.push(...getAroundBlockIndexes(toCheckIndexes[j]))
      }
      toCheckIndexes = newToCheckIndexes
    }
    groupId += 1
  }
  return contrours
}
