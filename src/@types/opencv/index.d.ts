import { Mat } from './core/Mat'
import { matFromArray, matFromImageData } from './core/helpers'
import { cvtColor } from './gen/functions'
import { COLOR_RGBA2GRAY, COLOR_GRAY2RGBA, CV_8UC4 } from './gen/constants'

export interface OpenCV {
  Mat: typeof Mat
  COLOR_RGBA2GRAY: typeof COLOR_RGBA2GRAY
  COLOR_GRAY2RGBA: typeof COLOR_GRAY2RGBA
  CV_8UC4: typeof CV_8UC4
  cvtColor: typeof cvtColor
  matFromArray: typeof matFromArray
  matFromImageData: typeof matFromImageData
}
