export const uniq = <T>(array: T[]) => {
  return [...new Set(array)];
}

export const uniqObjectArray = <T, U extends keyof T>(array: T[], ...args: U[]) => {
  const existKeys: { [key in U]: T[key] }[] = []
  return array.filter(v => {
    if (existKeys.some(ek => {
      for (const arg of args) {
        if (v[arg] !== ek[arg]) return false
      }
      return true
    })) {
      return false
    }
    existKeys.push(v)
    return true
  })
}

export const dataToBinary = (data: Uint8ClampedArray | number[], width: number, height: number) => {
  const binary = []
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      if (
        data[(i * width + j) * 4 + 0] > 200 &&
        data[(i * width + j) * 4 + 1] > 200 &&
        data[(i * width + j) * 4 + 2] > 200
      ) {
        binary.push(true)
      } else {
        binary.push(false)
      }
    }
  }
  return binary
}

export const binaryToData = (binary: boolean[], data: Uint8ClampedArray) => {
  for (let i = 0; i < binary.length; i++) {
    if (binary[i]) {
      data[i * 4 + 0] = 255
      data[i * 4 + 1] = 255
      data[i * 4 + 2] = 255
    } else {
      data[i * 4 + 0] = 0
      data[i * 4 + 1] = 0
      data[i * 4 + 2] = 0
    }
    data[i * 4 + 3] = 255
  }
}
