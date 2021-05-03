importScripts('wasm-util.js', 'module.js', 'build/cv-wasm.js');
import { convertBinary, ToBackgroundFromWebWorkerEvent, ToWebWorkerFromBackground } from "./lib/typing/message";
import { OpenCV } from "./@types/opencv";
import compareF from './lib/compareFeature'
import compareP from './lib/comparePixel'
import compareH from './lib/compareHist'
declare var cv: OpenCV

const convertToBinary = (msg: convertBinary) => {
  const start = performance.now()

  const { data, width, height, time } = msg

  const imgRaw = cv.matFromArray(width, height, cv.CV_8UC4, data)
  const gray = new cv.Mat()
  cv.cvtColor(imgRaw, gray, cv.COLOR_RGBA2GRAY, 0)

  const binary = new cv.Mat()
  cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)

  const result = new cv.Mat()
  cv.cvtColor(binary, result, cv.COLOR_GRAY2RGBA, 0)

  const resultData = Array.from(result.data);
  postMessageToBackground({ type: 'convertToBinary', time, data: resultData, width: width, height: height });

  imgRaw.delete()
  gray.delete()
  binary.delete()
  result.delete()

  console.log(`${performance.now() - start}ms`)
}

addEventListener('message', (ev: MessageEvent<ToWebWorkerFromBackground>) => {
  const msg = ev.data;
  console.log('from background')
  switch (msg.type) {
    case 'convertToBinary':
      convertToBinary(msg)
      break
    case 'compare':
      // compareH(cv, postMessageToBackground, msg)
      // compareF(cv, postMessageToBackground, msg)
      // compareP(cv, postMessageToBackground, msg)
      // compareHist(cv, postMessageToBackground, msg)
      break
    default:
      const _exhaustiveCheck: never = msg;
  }
});

Module.onInit(() => {
  postMessageToBackground({ type: 'initialize' });
});

const postMessageToBackground = (msg: ToBackgroundFromWebWorkerEvent) => postMessage(msg)
