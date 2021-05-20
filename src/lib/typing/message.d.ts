export type ToWebWorkerFromBackground = convertBinary | Compare | End
export type ToBackgroundFromWebWorkerEvent = convertBinary | Initialize | CompareResultHist | CompareResultPixel | CompareResultFeature

export type ToContentFromBackground = convertBinary | CompareResult | CompareResultPixel
export type ToBackgroundFromContent = convertBinary | Enque | End

export type convertBinary = { type: 'convertToBinary' } & ImageInfo
export type Enque = { type: 'enque' } & ImageInfo
export type Initialize = { type: 'initialize' }
export type Compare = { type: 'compare', img1: ImageInfo, img2: ImageInfo }
export type CompareResultHist = { type: 'compareHist', time: number, result: number }
export type CompareResultPixel = { type: 'comparePixel', time: number, result: number }
export type CompareResultFeature = { type: 'compareFeature', time: number, result: number }
export type CompareResult = { type: 'compareResult', time: number, result: number }
export type End = { type: 'end' }
export type OCR = { type: 'ocr', url: string }

export type ImageInfo = { time: number, width: number, height: number, cols: number, side: number, data: number[] }
export type Block = { row: number, col: number, score: number }

export type ToWebWorkerFromPage = Enque | End
export type ToPageFromWebWorker = Initialize | CompareResult
