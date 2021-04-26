import { Block } from "./typing/message"
import { UserOption } from "./typing/option"
import { uniq, uniqObjectArray } from "./utils"

export const getSide = (width: number, option?: UserOption) => {
  const ratio = option?.sideRatio ?? 0.025
  return  Math.ceil(width * ratio)
}

export const getBlocks = (data: Uint8ClampedArray, width: number, height: number, side: number): Block[] => {
  const result = []
  const rows = Math.ceil(height / side)
  const cols = Math.ceil(width / side)
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
      result.push({ row, col, score })
    }
  }
  return result
}

interface BlockGroup {
  rows: number
  cols: number
  blocks: (Block & { isOuter?: boolean })[]
}
export const getBlockGroups = (blocks: Block[], width: number, height: number, side: number, threshold: number): BlockGroup[] => {
  const checked: boolean[] = new Array(blocks.length).fill(false)

  const rows = Math.ceil(height / side)
  const cols = Math.ceil(width / side)
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

  const groups: BlockGroup[] = []
  for (let i = 0; i < blocks.length; i++) {
    // もう、このBlockに関係するGroupが探索されてたらスキップ
    if (checked[i]) continue
    checked[i] = true

    if (blocks[i].score < threshold) continue
    const groupData = { left: blocks[i].col, right: blocks[i].col, top: blocks[i].row, bottom: blocks[i].row }
    const groupBlocks: Block[] = []
    groupBlocks.push(blocks[i])

    let toCheckIndexes = getAroundBlockIndexes(i)
    while (true) {
      if (toCheckIndexes.length === 0) break
      const newToCheckIndexes: number[] = []
      // 上下左右で閾値を超えているものがあるか探索
      for (let j = 0; j < toCheckIndexes.length; j++) {
        if (checked[toCheckIndexes[j]]) continue
        checked[toCheckIndexes[j]] = true

        if (blocks[toCheckIndexes[j]].score < threshold) continue
        groupBlocks.push(blocks[toCheckIndexes[j]])
        newToCheckIndexes.push(...getAroundBlockIndexes(toCheckIndexes[j]))

        if (groupData.left > blocks[toCheckIndexes[j]].col) groupData.left = blocks[toCheckIndexes[j]].col
        if (groupData.right < blocks[toCheckIndexes[j]].col) groupData.right = blocks[toCheckIndexes[j]].col
        if (groupData.top > blocks[toCheckIndexes[j]].row) groupData.top = blocks[toCheckIndexes[j]].row
        if (groupData.bottom < blocks[toCheckIndexes[j]].row) groupData.bottom = blocks[toCheckIndexes[j]].row
      }
      toCheckIndexes = newToCheckIndexes
    }

    groups.push({ rows: groupData.bottom - groupData.top, cols: groupData.right - groupData.left, blocks: groupBlocks })
  }
  return groups
}

const getLongestIndex = (groups: BlockGroup[], direction: 'rows' | 'cols' = 'cols') => {
  if (groups.length === 0) {
    throw 'there no block group'
  }
  let longest = groups[0]
  let index = 0
  for (let i = 0; i < groups.length; i++) {
    if (longest[direction] <= groups[i][direction]) {
      longest = groups[i]
      index = i
    }
  }
  return index
}

export const getMergedLongest = (groups: BlockGroup[], maxBury: 1 | 2) => {
  const index = getLongestIndex(groups)
  const longest = groups[index]
  const newLongest: BlockGroup = { rows: 0, cols: 0, blocks: [] }
  const newBlocks: Block[] = [...longest.blocks]
  const rmIndex = []
  // memo: longestのBlockを並び替えると計算量減りそう
  for (let i = 0; i < longest.blocks.length; i++) {
    for (let j = 0; j < groups.length; j++) {
      if (j === index) continue
      for (let k = 0; k < groups[j].blocks.length; k ++) {
        const rowDiff = groups[j].blocks[k].row - longest.blocks[i].row
        const colDiff = groups[j].blocks[k].col - longest.blocks[i].col

        // 縦/横/斜め 部分をガッと埋める
        if (Math.abs(rowDiff) + Math.abs(colDiff) - 1 <= maxBury) {
          const rowMin = Math.min(longest.blocks[i].row, groups[j].blocks[k].row)
          const rowMax = Math.max(longest.blocks[i].row, groups[j].blocks[k].row)
          const colMin = Math.min(longest.blocks[i].col, groups[j].blocks[k].col)
          const colMax = Math.max(longest.blocks[i].col, groups[j].blocks[k].col)
          for (let l = rowMin; l <= rowMax; l++) {
            for (let m = colMin; m <= colMax; m++) {
              newBlocks.push({ row: l, col: m, score: 0 })
            }
          }
          rmIndex.push(j)
          newBlocks.push(...groups[j].blocks)
          continue
        }
      }
    }
  }
  const uniqRmIndexes = uniq([...rmIndex, index])
  groups = groups.filter((_, i) => !uniqRmIndexes.includes(i))
  newLongest.blocks = uniqObjectArray(newBlocks, 'col', 'row')

  // rowsとcolsをセット
  let minRow = newLongest.blocks[0].row
  let maxRow = newLongest.blocks[0].row
  let minCol = newLongest.blocks[0].col
  let maxCol = newLongest.blocks[0].col
  for (let i = 0; i < newLongest.blocks.length; i++) {
    if (minCol > newLongest.blocks[i].col) minCol = newLongest.blocks[i].col
    if (maxCol < newLongest.blocks[i].col) maxCol = newLongest.blocks[i].col
    if (minRow > newLongest.blocks[i].row) minRow = newLongest.blocks[i].row
    if (maxRow < newLongest.blocks[i].row) maxRow = newLongest.blocks[i].row
  }
  newLongest.rows = maxRow - minRow
  newLongest.cols = maxCol - minCol
  return newLongest
}
