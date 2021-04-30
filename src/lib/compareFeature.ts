import { OpenCV } from "../@types/opencv";
import { ImageInfo, ToBackgroundFromWebWorkerEvent } from "./typing/message";

const compare = (cv: OpenCV, callback: (msg: ToBackgroundFromWebWorkerEvent) => void, msg: { img1: ImageInfo, img2: ImageInfo}) => {
  const start = performance.now()

  const { width, height } = msg.img1
  if (width !== msg.img2.width || height !== msg.img2.height) return 1

  const bf = new cv.BFMatcher(cv.NORM_HAMMING)
  // const detector = new cv.AKAZE()
  const detector = new cv.ORB()

  const img1Raw = cv.matFromArray(width, height, cv.CV_8UC4, msg.img1.data)
  const img1 = new cv.Mat()
  cv.cvtColor(img1Raw, img1, cv.COLOR_RGBA2GRAY, 0)
  const img1KP = new cv.KeyPointVector()
  const img1desc = new cv.Mat()
  detector.detectAndCompute(img1, new cv.Mat(), img1KP, img1desc)

  const img2Raw = cv.matFromArray(width, height, cv.CV_8UC4, msg.img2.data)
  const img2 = new cv.Mat()
  cv.cvtColor(img2Raw, img2, cv.COLOR_RGBA2GRAY, 0)
  const img2KP = new cv.KeyPointVector()
  const img2desc = new cv.Mat()
  detector.detectAndCompute(img2, new cv.Mat(), img2KP, img2desc)

  const matches = new cv.DMatchVectorVector()
  bf.knnMatch(img1desc, img2desc, matches, 2)
  const matchLength = matches.size()

  // for (let i = 0; i < (10 > matchLength ? matchLength : 10); i++) {
  //   console.log(matches.get(i))
  // }
  let len = 0
  for (let i = 0; i < matchLength; i++) {
    const match = matches.get(i)
    const md = match.get(0)
    const nd = match.get(1)
    if (md.distance < 0.5 * nd.distance) {
      len++
    }
  }
  // const result = new cv.Mat()
  // cv.drawMatchesKnn(img1, img1KP, img2, img2KP, good, result)

  // callback({ type: 'convertToBinary', data: Array.from(result.data), width, height, time: 0 })
  callback({ type: 'compareFeature', time: msg.img1.time, result: len });
  console.log('postMessage')
  img1Raw.delete()
  img1.delete()
  img1KP.delete()
  img1desc.delete()
  img2Raw.delete()
  img2.delete()
  img2KP.delete()
  img2desc.delete()
  matches.delete()
  console.log('end', (performance.now() - start) / 1000)
}
export default compare