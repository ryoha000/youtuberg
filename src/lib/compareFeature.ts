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

  const matches = new cv.DMatchVector()
  bf.match(img1desc, img2desc, matches)
  const matchLength = matches.size()
  let dist = 0
  console.log(matches.get(0))
  for (let i = 0; i < (10 > matchLength ? matchLength : 10); i++) {
    console.log(matches.get(i))
  }
  for (let i = 0; i < matchLength; i++) {
    dist += matches.get(i).distance
  }
  console.log('dist', dist, 'len', matchLength, 'result', dist / matchLength)

  // callback({ type: 'compare', result: dist / matchLength });
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