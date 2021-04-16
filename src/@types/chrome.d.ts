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
  }
}
interface Tab {
  url: string
  id: string
}
declare var chrome: ChromeExtension

declare function postMessage(message: any, targetOrigin?: string, transfer?: Transferable[] | undefined): void
