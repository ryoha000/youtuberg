importScripts('wasm-util.js', 'module.js', 'build/cv-wasm.js');
import { ConvertGray, ToBackgroundFromWebWorkerEvent, ToWebWorkerFromBackground } from "./lib/typing/message";
import { OpenCV } from "./@types/opencv";
// import compare from './lib/compareHist'
import compare from './lib/comparePixel'
declare var cv: OpenCV

const convertToGray = (msg: ConvertGray) => {
  const { data, width, height, time } = msg

  const imgRaw = cv.matFromArray(width, height, cv.CV_8UC4, data)
  const gray = new cv.Mat()
  cv.cvtColor(imgRaw, gray, cv.COLOR_RGBA2GRAY, 0)

  const binary = new cv.Mat()
  cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)

  // const closing  = new cv.Mat()
  // const kernel = cv.Mat.ones(3, 10, cv.CV_8UC1)
  // cv.morphologyEx(binary, closing , cv.MORPH_CLOSE, kernel)

  // console.log('setup Mat')
  // const img_ = new cv.Mat()
  // // cv.cvtColor(imgRaw, img, cv.COLOR_RGBA2GRAY, 0)
  // console.log('cv.CV_8UC1', cv.CV_8UC1)
  // cv.Laplacian(img_, img, cv.CV_8UC1)

  // console.log('end lap')
  // const img2 = new cv.Mat()
  // cv.threshold(img, img2, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)

  // cv.cvtColor(img, imgRaw, cv.COLOR_GRAY2RGBA, 0)
  const result = new cv.Mat()
  cv.cvtColor(binary , result, cv.COLOR_GRAY2RGBA, 0)
  console.log('cvtColor')
  const data1 = Array.from(result.data);
  postMessageToBackground({ type: 'convertToGray', time, data: data1, width: width, height: height });
  console.log('postMessage')

  imgRaw.delete()
  gray.delete()
  binary.delete()
  // closing .delete()
  result.delete()
}

addEventListener('message', (ev: MessageEvent<ToWebWorkerFromBackground>) => {
  const meta = ev.data;
  console.log('from background')
  switch (meta.type) {
    case 'convertToGray':
      convertToGray(meta)
      break
    case 'compare':
      compare(cv, postMessageToBackground, meta)
      // compareHist(cv, postMessageToBackground, meta)
      break
    default:
      const _exhaustiveCheck: never = meta;
  }
});

Module.onInit(() => {
  postMessageToBackground({ type: 'initialize' });
});

const postMessageToBackground = (msg: ToBackgroundFromWebWorkerEvent) => postMessage(msg)
