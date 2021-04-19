interface ChromeExtension {
  tabs: {
    query: (option: { active: boolean, currentWindow: boolean }, callback: (tabs: Tab[]) => void) => void
    sendMessage: <T>(tabId: string, obj: T, callback: (msg: string) => void) => void
  }
  browserAction: {
    onClicked: {
      addListener: (callback: (tab: Tab) => void) => void
    }
  }
  runtime: {
    getURL: (path: string) => string
    sendMessage: <T>(obj: T, callback: (msg: string) => void) => void
    onMessage: {
      addListener: <T>(callback: (req: T, sender: Sender, sendResponse: () => void) => boolean) => void
    }
  }
}
interface Tab {
  url: string
  id: string
}
interface Sender {
  id: string
  tab: Tab
}
declare var chrome: ChromeExtension

declare function postMessage<T>(message: T, targetOrigin?: string, transfer?: Transferable[] | undefined): void
type Valueof<T> = T[keyof T]
