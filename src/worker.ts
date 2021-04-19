importScripts('wasm-util.js', 'module.js', 'build/cv-wasm.js');
import { ToBackgroundFromWebWorkerEvent, ToWebWorkerFromBackground } from "./lib/typing/message";
import { OpenCV } from "./@types/opencv";
import compare from './lib/compareHist'
declare var cv: OpenCV

addEventListener('message', (ev: MessageEvent<ToWebWorkerFromBackground>) => {
  const meta = ev.data;
  console.log('from background', meta)
  switch (meta.type) {
    case 'convertToGray':
      const { data, width, height } = meta
      const img1Raw = cv.matFromArray(width, height, cv.CV_8UC4, data);
      const img1 = new cv.Mat();
      console.log('setup Mat')
      cv.cvtColor(img1Raw, img1, cv.COLOR_RGBA2GRAY, 0)
      cv.cvtColor(img1, img1Raw, cv.COLOR_GRAY2RGBA, 0)
      console.log('cvtColor')
      const data1 = Array.from(img1Raw.data);
      postMessageToBackground({ type: 'convertToGray', data: data1, width: width, height: height });
      console.log('postMessage')
      img1.delete()
      img1Raw.delete()
      break
    case 'compare':
      compare(cv, postMessageToBackground, meta)
      break
    default:
  }
});

Module.onInit(() => {
  postMessageToBackground({ type: 'initialize' });
});

const postMessageToBackground = (msg: ToBackgroundFromWebWorkerEvent) => postMessage(msg)
