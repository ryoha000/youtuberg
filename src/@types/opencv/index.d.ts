import { Mat } from './core/Mat'
import { matFromArray, matFromImageData } from './core/helpers'
import { calcHist, compareHist, cvtColor, split } from './gen/functions'
import { COLOR_RGBA2GRAY, COLOR_GRAY2RGBA, CV_8UC4, HISTCMP_CORREL } from './gen/constants'
import { MatVector } from './core/vectors'

export interface OpenCV {
  Mat: typeof Mat
  MatVector: typeof MatVector

  COLOR_RGBA2GRAY: typeof COLOR_RGBA2GRAY
  COLOR_GRAY2RGBA: typeof COLOR_GRAY2RGBA
  CV_8UC4: typeof CV_8UC4
  HISTCMP_CORREL: typeof HISTCMP_CORREL

  cvtColor: typeof cvtColor
  matFromArray: typeof matFromArray
  matFromImageData: typeof matFromImageData
  calcHist: typeof calcHist
  compareHist: typeof compareHist
  split: typeof split
}
