import { Enque, ToPageFromWebWorker, ToWebWorkerFromPage } from "../lib/typing/message";

const useWorker = (diffs: { time: number, diff: number}[]) => {
  const workers: Worker[] = []
  const WORKER_COUNT = Math.max(navigator.hardwareConcurrency - 1, 1) * 2
  const isInitialised: boolean[] = (new Array(WORKER_COUNT)).fill(false)

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
              diffs.push({ time: data.time, diff: data.result })
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
        workers.push(worker)
      }
    })
  }

  let lastCuedIndex = -1

  const postMessageToWebWorkers = (msg: ToWebWorkerFromPage, index: number) => {
    workers[index].postMessage(msg)
  }

  const sendToAllWorker = (msg: ToWebWorkerFromPage) => {
    for (let i = 0; i < WORKER_COUNT; i++) {
      postMessageToWebWorkers(msg, i)
    }
  }
  
  const enque = (msg: Enque) => {
    if (msg.time !== 0) {
      postMessageToWebWorkers(msg, lastCuedIndex)
    }
    const nextIndex = workers.length <= lastCuedIndex + 1 ? 0 : lastCuedIndex + 1
    lastCuedIndex = nextIndex
    postMessageToWebWorkers(msg, nextIndex)
  }

  const destroyWorkers = () => {
    for (let i = 0; i < WORKER_COUNT; i++) {
      workers[i].terminate()
    }
  }
  
  return { enque, sendToAllWorker, setupWorkers, destroyWorkers }
}

export default useWorker
