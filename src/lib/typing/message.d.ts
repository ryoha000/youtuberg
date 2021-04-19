export type ToWebWorkerFromBackground = ConvertGray | Compare
export type ToBackgroundFromWebWorkerEvent = ConvertGray | Initialize | CompareResult

export type ToContentFromBackground = ConvertGray
export type ToBackgroundFromContent = ConvertGray | Enque

export type ConvertGray = { type: 'convertToGray' } & ImageInfo
export type Enque = { type: 'enque' } & ImageInfo
export type Initialize = { type: 'initialize' }
export type Compare = { type: 'compare', img1: ImageInfo, img2: ImageInfo }
export type CompareResult = { type: 'compare', result: number }

export type ImageInfo = { width: number, height: number, data: number[] }
