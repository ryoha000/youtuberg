importScripts('wasm-util.js', 'module.js', 'build/cv-wasm.js');
import { ConvertGray, ToBackgroundFromWebWorkerEvent, ToWebWorkerFromBackground } from "./lib/typing/message";
import { OpenCV } from "./@types/opencv";
import compareHist from './lib/compareHist'
// import compare from './lib/compareFeature'
import compare from './lib/comparePixel'
declare var cv: OpenCV

// type Handler<T extends { type: string }> = {
//   [K in T['type']]: (args: T & { [T['type']]: K }) => void
// }
type Handler<Data extends { type: string }> = {
  [K in Data['type']]: (data: Data & { type: K }) => void
}

const handler: Handler<ToWebWorkerFromBackground> = {
  'convertToGray': (msg) => convertToGray(msg),
  'compare': (msg) => compare(cv, postMessageToBackground, msg)
}

const convertToGray = (msg: ConvertGray) => {
  const { data, width, height, time } = msg
  const img1Raw = cv.matFromArray(width, height, cv.CV_8UC4, data);
  const img1 = new cv.Mat();
  console.log('setup Mat')
  cv.cvtColor(img1Raw, img1, cv.COLOR_RGBA2GRAY, 0)
  cv.cvtColor(img1, img1Raw, cv.COLOR_GRAY2RGBA, 0)
  console.log('cvtColor')
  const data1 = Array.from(img1Raw.data);
  postMessageToBackground({ type: 'convertToGray', time, data: data1, width: width, height: height });
  console.log('postMessage')
  img1.delete()
  img1Raw.delete()
}
addEventListener('message', (ev: MessageEvent<ToWebWorkerFromBackground>) => {
  const meta = ev.data;
  console.log('from background')
  handler[meta.type](meta)
  // switch (meta.type) {
  //   case 'convertToGray':
  //     const { data, width, height, time } = meta
  //     const img1Raw = cv.matFromArray(width, height, cv.CV_8UC4, data);
  //     const img1 = new cv.Mat();
  //     console.log('setup Mat')
  //     cv.cvtColor(img1Raw, img1, cv.COLOR_RGBA2GRAY, 0)
  //     cv.cvtColor(img1, img1Raw, cv.COLOR_GRAY2RGBA, 0)
  //     console.log('cvtColor')
  //     const data1 = Array.from(img1Raw.data);
  //     postMessageToBackground({ type: 'convertToGray', time, data: data1, width: width, height: height });
  //     console.log('postMessage')
  //     img1.delete()
  //     img1Raw.delete()
  //     break
  //   case 'compare':
  //     compare(cv, postMessageToBackground, meta)
  //     // compareHist(cv, postMessageToBackground, meta)
  //     break
  //   default:
  // }
});

Module.onInit(() => {
  postMessageToBackground({ type: 'initialize' });
});

const postMessageToBackground = (msg: ToBackgroundFromWebWorkerEvent) => postMessage(msg)
