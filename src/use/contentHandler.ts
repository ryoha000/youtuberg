import { drawGroups } from "../lib/canvas";
import { convertBinary } from "../lib/typing/message";
import { fillMissingBlock, getLongestLabelIds, getMergedContrours, getScoresBinary, getSide } from '../lib/block'
import { findControursFromBinary } from '../lib/contrours'
import { binaryGroupedSizeFilter } from '../lib/filter'
import { groupByScores } from '../lib/grouping'
import { binaryToData, dataToBinary } from '../lib/utils'

export const convertToBinary = ($canvas: HTMLCanvasElement) => (msg: convertBinary) => {
  console.log('response img from background')
  const { data, width, height } = msg
  $canvas.width = width
  $canvas.height = height

  const ctx = $canvas.getContext("2d");
  if (!ctx) throw 'couldnt get 2d context'
  ctx.clearRect(0, 0, width, height);
  ctx.filter = 'grayscale(1)'

  const out = ctx.createImageData(width, height);
  const outData = out.data
  const binary = dataToBinary(data, width, height)

  const labels: number[] = new Array(width * height)
  const contrours: number[] = new Array(width * height)
  const areas: number[] = []
  const sizes: { rows: number, cols: number }[] = []
  findControursFromBinary(binary, height, width, labels, contrours, areas, sizes)

  const blockSide = width * 0.02

  const noiseFilteredBinary = binaryGroupedSizeFilter(labels, areas, sizes, blockSide)

  const side = getSide(width)
  const rows = Math.ceil(height / side)
  const cols = Math.ceil(width / side)
  const scores = getScoresBinary(noiseFilteredBinary, width, height, rows, cols, side)
  const groupedLabels: number[] = new Array(rows * cols)
  groupByScores(scores, rows, cols, groupedLabels, contrours, side * side * 0.07)
  getMergedContrours(groupedLabels, contrours, scores, cols, side * side * 0.02)
  fillMissingBlock(groupedLabels, rows, cols)

  // ブロックのビジュアライズ
  binaryToData(binary, outData)
  // binaryToData(noiseFilteredBinary, outData)
  // drawGroups(outData, groupedLabels, width, height, cols, side, [0])
  ctx.putImageData(out, 0, 0);

  const ids = getLongestLabelIds(groupedLabels, cols)

  return { label: groupedLabels, cols, side, longestIds: ids }
}
