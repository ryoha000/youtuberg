export type ToWebWorkerFromBackground = ConvertGray
export type ToBackgroundFromWebWorkerEvent = ConvertGray | Initialize

export type ToContentFromBackground = ConvertGray
export type ToBackgroundFromContent = ConvertGray

export type ConvertGray = { type: 'convertToGray', width: number, height: number, data: number[] }
export type Initialize = { type: 'initialize' }

type Valueof<T> = T[keyof T]
export type Handler<T extends { 'type': string }> = { [key in Valueof<Pick<T, 'type'>>]: (args: T & { [T['type']]: key }) => void }
