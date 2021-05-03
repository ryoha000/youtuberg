import { drawGroups } from "./canvas";

export const compareGroup = ($canvas: HTMLCanvasElement, label1: number[], label2: number[], cols: number, side: number) => {
  const ctx = $canvas.getContext("2d");
  if (!ctx) throw 'couldnt get 2d context'
  const width = $canvas.width
  const height = $canvas.height

  const out = ctx.createImageData(width, height);
  const outData = out.data;

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

  drawGroups(outData, newLabel, width, height, cols, side, [0])
  ctx.putImageData(out, 0, 0);
  return newLabel
}
