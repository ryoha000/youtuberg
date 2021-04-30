import type { Mat } from './core/Mat'
import type { matFromArray, matFromImageData } from './core/helpers'
import type { calcHist, compareHist, cvtColor, split, threshold, morphologyEx, findContours, drawContours, drawMatchesKnn, adaptiveThreshold } from './gen/functions'
import type { COLOR_RGBA2GRAY, COLOR_GRAY2RGBA, CV_8UC4, HISTCMP_CORREL, NORM_HAMMING, ADAPTIVE_THRESH_GAUSSIAN_C, THRESH_OTSU, THRESH_BINARY, CV_8UC1, MORPH_CLOSE, RETR_TREE, CHAIN_APPROX_SIMPLE } from './gen/constants'
import type { MatVector, KeyPointVector, DMatchVector, DMatchVectorVector } from './core/vectors'
import type { AKAZE, BFMatcher, ORB } from './gen/classes'
import type { Size, Point } from './core/valueObjects'

export interface OpenCV {
  Mat: typeof Mat
  MatVector: typeof MatVector
  BFMatcher: typeof BFMatcher
  AKAZE: typeof AKAZE
  ORB: typeof ORB
  KeyPointVector: typeof KeyPointVector
  DMatchVector: typeof DMatchVector
  DMatchVectorVector: typeof DMatchVectorVector
  Size: typeof Size
  Point: typeof Point

  COLOR_RGBA2GRAY: typeof COLOR_RGBA2GRAY
  COLOR_GRAY2RGBA: typeof COLOR_GRAY2RGBA
  CV_8UC4: typeof CV_8UC4
  HISTCMP_CORREL: typeof HISTCMP_CORREL
  NORM_HAMMING: typeof NORM_HAMMING
  THRESH_OTSU: typeof THRESH_OTSU
  THRESH_BINARY: typeof THRESH_BINARY
  CV_8UC1: typeof CV_8UC1
  MORPH_CLOSE: typeof MORPH_CLOSE
  RETR_TREE: typeof RETR_TREE
  CHAIN_APPROX_SIMPLE: typeof CHAIN_APPROX_SIMPLE
  ADAPTIVE_THRESH_GAUSSIAN_C: typeof ADAPTIVE_THRESH_GAUSSIAN_C

  cvtColor: typeof cvtColor
  matFromArray: typeof matFromArray
  matFromImageData: typeof matFromImageData
  calcHist: typeof calcHist
  compareHist: typeof compareHist
  split: typeof split
  threshold: typeof threshold
  morphologyEx: typeof morphologyEx
  findContours: typeof findContours
  drawContours: typeof drawContours
  drawMatchesKnn: typeof drawMatchesKnn
  adaptiveThreshold: typeof adaptiveThreshold
}
