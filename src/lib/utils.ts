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
