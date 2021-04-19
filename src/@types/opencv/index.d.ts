import { Mat } from './core/Mat'
import { matFromArray, matFromImageData } from './core/helpers'
import { calcHist, compareHist, cvtColor, split } from './gen/functions'
import { COLOR_RGBA2GRAY, COLOR_GRAY2RGBA, CV_8UC4, HISTCMP_CORREL, NORM_HAMMING } from './gen/constants'
import { MatVector, KeyPointVector, DMatchVector } from './core/vectors'
import { AKAZE, BFMatcher, ORB } from './gen/classes'

export interface OpenCV {
  Mat: typeof Mat
  MatVector: typeof MatVector
  BFMatcher: typeof BFMatcher
  AKAZE: typeof AKAZE
  ORB: typeof ORB
  KeyPointVector: typeof KeyPointVector
  DMatchVector: typeof DMatchVector

  COLOR_RGBA2GRAY: typeof COLOR_RGBA2GRAY
  COLOR_GRAY2RGBA: typeof COLOR_GRAY2RGBA
  CV_8UC4: typeof CV_8UC4
  HISTCMP_CORREL: typeof HISTCMP_CORREL
  NORM_HAMMING: typeof NORM_HAMMING

  cvtColor: typeof cvtColor
  matFromArray: typeof matFromArray
  matFromImageData: typeof matFromImageData
  calcHist: typeof calcHist
  compareHist: typeof compareHist
  split: typeof split
}
