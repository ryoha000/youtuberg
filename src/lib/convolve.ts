const getEle = (data: Uint8ClampedArray, width: number, suffix: number, row: number, col: number) => {
  if (row >= 0 && col >= 0) {
    return data[(row * width + col) * 4 + suffix]
  }
  return 0
}

export const convolve3x3 = (data: Uint8ClampedArray, kernel: number[], i: number, width: number, j: number, suffix: number) => {
  return (
      kernel[0] * getEle(data, width, suffix, i - 1, j - 1)
    + kernel[1] * getEle(data, width, suffix, i - 1, j    )
    + kernel[2] * getEle(data, width, suffix, i - 1, j + 1)
    + kernel[3] * getEle(data, width, suffix, i    , j - 1)
    + kernel[4] * getEle(data, width, suffix, i    , j    )
    + kernel[5] * getEle(data, width, suffix, i    , j + 1)
    + kernel[6] * getEle(data, width, suffix, i + 1, j - 1)
    + kernel[7] * getEle(data, width, suffix, i + 1, j    )
    + kernel[8] * getEle(data, width, suffix, i + 1, j + 1)
  )
}
