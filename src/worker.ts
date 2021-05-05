importScripts('wasm-util.js', 'module.js', 'build/cv-wasm.js');
import { convertBinary, ToBackgroundFromWebWorkerEvent, ToWebWorkerFromBackground } from "./lib/typing/message";
import { OpenCV } from "./@types/opencv";
import { binaryGroupedSizeFilter } from "./lib/filter";
import { fillMissingBlock, getMergedContrours, getScoresBinary, getSide } from "./lib/block";
import { findControursFromBinary } from "./lib/contrours";
import { dataToBinary } from "./lib/utils";
import { groupByScores } from "./lib/grouping";
declare var cv: OpenCV

const convertToBinary = (msg: convertBinary) => {
  const { data, width, height, time } = msg

  const imgRaw = cv.matFromArray(width, height, cv.CV_8UC4, data)
  const gray = new cv.Mat()
  cv.cvtColor(imgRaw, gray, cv.COLOR_RGBA2GRAY, 0)

  const binary = new cv.Mat()
  cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)

  const result = new cv.Mat()
  cv.cvtColor(binary, result, cv.COLOR_GRAY2RGBA, 0)

  imgRaw.delete()
  gray.delete()
  binary.delete()
  // result.delete()

  return ({ time, mat: result, width: width, height: height })
}

const labels: number[][] = []
addEventListener('message', (ev: MessageEvent<ToWebWorkerFromBackground>) => {
  const msg = ev.data;
  switch (msg.type) {
    case 'convertToBinary':
      try {
        const data = convertToBinary(msg)
        const label = getLabel(data.mat.data, data.width, data.height)
        data.mat.delete()
        labels.push(label)
      } catch (e) {
        labels.push([])
        console.error(e)
      }
      if (labels.length === 2) {
        if (labels[0].length !== labels[1].length) {
          postMessageToBackground({ type: 'comparePixel', time: msg.time, result: 0 })
          labels.splice(0, 2)
        } else {
          const d = compareGroup(labels[0], labels[1])
          postMessageToBackground({ type: 'comparePixel', time: msg.time, result: d })
          labels.splice(0, 2)
        }
      }
      break
    case 'compare':
      break
    case 'end':
      labels.splice(0, 2)
      break
    default:
      const _exhaustiveCheck: never = msg;
  }
});

Module.onInit(() => {
  postMessageToBackground({ type: 'initialize' });
});

const postMessageToBackground = (msg: ToBackgroundFromWebWorkerEvent) => postMessage(msg)

const getLabel = (data: number[] | Uint8Array, width: number, height: number) => {
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

  return groupedLabels
}

const compareGroup = (label1: number[], label2: number[]) => {
  if (label1.length !== label2.length) {
    throw 'not match length'
  }
  const newLabel: number[] = []
  for (let i = 0; i < label1.length; i++) {
    if ((label1[i] === 0 || label2[i] === 0) && (label1[i] !== 0 || label2[i] !== 0)) {
      newLabel.push(1)
    } else {
      newLabel.push(0)
    }
  }
  return newLabel.filter(v => v === 1).length 
}
