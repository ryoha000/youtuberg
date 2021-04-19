import { OpenCV } from "../@types/opencv";
import { ImageInfo, ToBackgroundFromWebWorkerEvent } from "./typing/message";

const compare = (cv: OpenCV, callback: (msg: ToBackgroundFromWebWorkerEvent) => void, msg: { img1: ImageInfo, img2: ImageInfo}) => {
  const start = performance.now()
  console.log('start', start)

  const { width, height, time } = msg.img1
  if (width !== msg.img2.width || height !== msg.img2.height) return 1
  const img1Raw = cv.matFromArray(width, height, cv.CV_8UC4, msg.img1.data)
  const img1MV = new cv.MatVector()
  cv.split(img1Raw, img1MV)
  const img1Hist = new cv.Mat()
  cv.calcHist(img1MV, [0], new cv.Mat(), img1Hist, [256], [0, 256])

  const img2Raw = cv.matFromArray(width, height, cv.CV_8UC4, msg.img2.data)
  const img2MV = new cv.MatVector()
  cv.split(img2Raw, img2MV)
  const img2Hist = new cv.Mat()
  cv.calcHist(img2MV, [0], new cv.Mat(), img2Hist, [256], [0, 256])

  const result = cv.compareHist(img1Hist, img2Hist, cv.HISTCMP_CORREL)
  console.log('result', result)

  callback({ type: 'compareHist', time, result });
  console.log('postMessage')
  img1Raw.delete()
  img1Hist.delete()
  img1MV.delete()
  img2Raw.delete()
  img2Hist.delete()
  img2MV.delete()
  console.log('end', (performance.now() - start) / 1000)
}
export default compare
