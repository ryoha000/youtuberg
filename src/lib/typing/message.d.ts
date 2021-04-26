export type ToWebWorkerFromBackground = ConvertGray | Compare
export type ToBackgroundFromWebWorkerEvent = ConvertGray | Initialize | CompareResultHist | CompareResultPixel

export type ToContentFromBackground = ConvertGray | CompareResult
export type ToBackgroundFromContent = ConvertGray | Enque | End

export type ConvertGray = { type: 'convertToGray' } & ImageInfo
export type Enque = { type: 'enque' } & ImageInfo
export type Initialize = { type: 'initialize' }
export type Compare = { type: 'compare', img1: ImageInfo, img2: ImageInfo }
export type CompareResultHist = { type: 'compareHist', time: number, result: number }
export type CompareResultPixel = { type: 'comparePixel', time: number, result: number }
export type CompareResult = { type: 'compareResult' }
export type End = { type: 'end' }
export type OCR = { type: 'ocr', url: string }

export type ImageInfo = { time: number, width: number, height: number, data: number[] }
export type Block = { row: number, col: number, score: number }
