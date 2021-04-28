import { OpenCV } from "../@types/opencv";
import { ImageInfo, ToBackgroundFromWebWorkerEvent } from "./typing/message";

const compare = (_: OpenCV, callback: (msg: ToBackgroundFromWebWorkerEvent) => void, msg: { img1: ImageInfo, img2: ImageInfo}) => {
  const start = performance.now()

  const { width, height, time } = msg.img1
  if (width !== msg.img2.width || height !== msg.img2.height) return 1
  const len = msg.img1.data.length
  let diff = 0
  for (let i = 0; i < len / 4; i++) {
    if (msg.img1.data[4 * i] !== msg.img2.data[4 * i] ||
      msg.img1.data[4 * i + 1] !== msg.img2.data[4 * i + 1] ||
      msg.img1.data[4 * i + 2] !== msg.img2.data[4 * i + 2]
    ) {
      diff++
    }
  }

  callback({ type: 'comparePixel', time, result: (1 - diff / len) * 100 });
  console.log('postMessage')
  console.log('end', (performance.now() - start) / 1000)
}
export default compare
