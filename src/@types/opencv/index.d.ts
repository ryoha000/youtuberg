import type { Mat } from './core/Mat'
import type { matFromArray, matFromImageData } from './core/helpers'
import type { calcHist, compareHist, cvtColor, split, threshold, morphologyEx } from './gen/functions'
import type { COLOR_RGBA2GRAY, COLOR_GRAY2RGBA, CV_8UC4, HISTCMP_CORREL, NORM_HAMMING, THRESH_OTSU, THRESH_BINARY, CV_8UC1, MORPH_CLOSE } from './gen/constants'
import type { MatVector, KeyPointVector, DMatchVector } from './core/vectors'
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

  cvtColor: typeof cvtColor
  matFromArray: typeof matFromArray
  matFromImageData: typeof matFromImageData
  calcHist: typeof calcHist
  compareHist: typeof compareHist
  split: typeof split
  threshold: typeof threshold
  morphologyEx: typeof morphologyEx
}
