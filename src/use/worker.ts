import { End, Enque, ToPageFromWebWorker, ToWebWorkerFromPage } from "../lib/typing/message";
import { State } from "../lib/typing/state";

const useWorker = (state: State) => {
  const workers: { isWork: boolean, worker: Worker }[] = []
  const WORKER_COUNT = Math.max(navigator.hardwareConcurrency - 1, 1) * 2
  const isInitialised: boolean[] = (new Array(WORKER_COUNT)).fill(false)
  let lastCuedIndex = -1
  const que: Enque[] = []

  const setupWorkers = () => {
    return new Promise<void>((resolve, reject) => {
      let isResolved = false
      setTimeout(() => {
        if (!isResolved) {
          console.error('timeout setupWorkers')
          reject('timeout setupWorkers')
        }
      }, 5000);
      for (let i = 0; i < WORKER_COUNT; i++) {
        const worker =  new Worker(chrome.runtime.getURL('worker.js'))
        worker.addEventListener('message', (ev: MessageEvent<ToPageFromWebWorker>) => {
          const data = ev.data
          switch (data.type) {
            case 'compareResult':
              state.diffs.push({ time: data.time, diff: data.result })
              workers[i].isWork = false
              if (que.length > 0) {
                sendCompare(que.shift()!)
              }
              break
            case 'initialize':
              isInitialised[i] = true
              if (!isInitialised.some(v => !v)) {
                resolve()
                isResolved = true
              }
              break
            default:
              const _ = data as never
              break
          }
        });
        workers.push({ worker, isWork: false })
      }
      state.enque = enque
      state.sendToAllWorker = sendToAllWorker
    })
  }

  const postMessageToWebWorkers = (msg: ToWebWorkerFromPage, index: number) => {
    workers[index].worker.postMessage(msg)
    workers[index].isWork = true
  }

  const sendToAllWorker = (msg: End) => {
    for (let i = 0; i < WORKER_COUNT; i++) {
      postMessageToWebWorkers(msg, i)
    }
    lastCuedIndex = -1
  }

  const enque = (msg: Enque) => {
    if (que.length === 0) {
      sendCompare(msg)
    } else {
      que.push(msg)
    }
  }
  
  const sendCompare = (msg: Enque) => {
    const nextIndex = workers.findIndex(v => !v.isWork)
    if (nextIndex === -1) {
      return
    }
    if (lastCuedIndex !== -1) {
      postMessageToWebWorkers(msg, lastCuedIndex)
    }
    lastCuedIndex = nextIndex
    postMessageToWebWorkers(msg, nextIndex)
  }

  const destroyWorkers = () => {
    for (let i = 0; i < WORKER_COUNT; i++) {
      workers[i].worker.terminate()
    }
  }
  
  return { enque, sendToAllWorker, setupWorkers, destroyWorkers }
}

export default useWorker
