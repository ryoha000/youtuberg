import { BinaryImage } from "./typing/image"

const convolveAnd3x3 = (data: boolean[], i: number, j: number, width: number, height: number) => {
  if (i === 0 || i === height - 1 || j === 0 || j === width - 1) return false
  return (
    data[(i - 1) * width + j - 1]
    && data[(i - 1) * width + j    ]
    && data[(i - 1) * width + j + 1]
    && data[(i    ) * width + j - 1]
    && data[(i    ) * width + j    ]
    && data[(i    ) * width + j + 1]
    && data[(i + 1) * width + j - 1]
    && data[(i + 1) * width + j    ]
    && data[(i + 1) * width + j + 1]
  )
}

const convolveOr3x3 = (data: boolean[], i: number, j: number, width: number, height: number) => {
  if (i === 0 || i === height - 1 || j === 0 || j === width - 1) return false
  return (
    data[(i - 1) * width + j - 1]
    || data[(i - 1) * width + j    ]
    || data[(i - 1) * width + j + 1]
    || data[(i    ) * width + j - 1]
    || data[(i    ) * width + j    ]
    || data[(i    ) * width + j + 1]
    || data[(i + 1) * width + j - 1]
    || data[(i + 1) * width + j    ]
    || data[(i + 1) * width + j + 1]
  )
}

export const erode3x3 = (binaryImage: BinaryImage) => {
  const result = []
  for (let i = 0; i < binaryImage.height; i++) {
    for (let j = 0; j < binaryImage.width; j++) {
      result.push(convolveAnd3x3(binaryImage.data, i, j, binaryImage.width, binaryImage.height))
    }
  }
  return result
}

export const dilate3x3 = (binaryImage: BinaryImage) => {
  const result = []
  for (let i = 0; i < binaryImage.height; i++) {
    for (let j = 0; j < binaryImage.width; j++) {
      result.push(convolveOr3x3(binaryImage.data, i, j, binaryImage.width, binaryImage.height))
    }
  }
  return result
}

export const dilate = (binaryImage: BinaryImage, kernelRowRadius: number, kernelColRadius: number) => {
  const result = []
  for (let row = 0; row < binaryImage.height; row++) {
    if (row < kernelRowRadius || row >= binaryImage.height - kernelRowRadius) {
      result.push(false)
      continue
    }
    for (let col = 0; col < binaryImage.width; col++) {
      if (col < kernelColRadius || col >= binaryImage.width - kernelColRadius) {
        result.push(false)
        continue
      }

      let binary = false
      for (let i = row - kernelRowRadius; i < row + kernelRowRadius; i++) {
        for (let j = col - kernelColRadius; j < col + kernelColRadius; j++) {
          binary ||= binaryImage.data[i * binaryImage.width + j]
          if (binary) break
        }
        if (binary) break
      }
      result.push(binary)
    }
  }
  return result
}

export const open3x3 = (binaryImage: BinaryImage) => {
  const eroded = erode3x3(binaryImage)
  const result = dilate3x3({ width: binaryImage.width, height: binaryImage.height, data: eroded })
  return result
}

export const close3x3 = (binaryImage: BinaryImage) => {
  const dilated = dilate3x3(binaryImage)
  const result = dilate3x3({ width: binaryImage.width, height: binaryImage.height, data: dilated })
  return result
}
