type PreparedArrayObject<T> = { object: T[], readonly isUse: boolean, readonly index: number }
type PreparedArrayObjectArray<T> = { array: PreparedArrayObject<T>[], initVal: T }
type PreparedObject<T> = { object: T, isUse: Readonly<boolean>, index: Readonly<number> }
type PreparedObjectArray<T> = { array: PreparedObject<T>[], initVal: T }

export const setupArrayPool = <T>(initVal: T, length: number, count: number): PreparedArrayObjectArray<T> => {
  const pool: PreparedArrayObject<T>[] = []
  for (let i = 0; i < count; i++) {
    const obj: T[] = []
    for (let j = 0; j < length; j++) {
      obj.push(initVal)
    }
    pool.push({ object: obj, isUse: false, index: i })
  }
  return { array: pool, initVal: initVal }
}

export const getArrayFromPool = <T>(pool: PreparedArrayObjectArray<T>) => {
  for (let i = 0; i < pool.array.length; i++) {
    if (!pool.array[i].isUse) {
      (pool.array[i].isUse as boolean) = true
      for (let j = 0; j < pool.array[i].object.length; j++) {
        pool.array[i].object[j] = pool.initVal
      }
      return pool.array[i]
    }
  }
  throw 'there no remain pool object'
}

export const returnArrayToPool = <T>(pool: PreparedArrayObjectArray<T>, object: PreparedArrayObject<T>) => {
  (pool.array[object.index].isUse as boolean) = false
}
