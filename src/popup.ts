import { render, html } from 'lit-html'

const template = (title: string) => html`<h1>${title}</h1>`
const app = document.getElementById('app')
async function getCurrentTab() {
  return new Promise<chrome.tabs.Tab>(resolve => {
    const queryOptions = { active: true, currentWindow: true };
    chrome.tabs.query(queryOptions, (tabs) => {
      resolve(tabs[0])
    });
  })
}
if (app) {
  console.log('exist app')
  getCurrentTab().then((tab) => {
    console.log(tab)
    chrome.tabs.sendMessage(tab.id ?? 0, 'activate')
    render(template(tab?.url ?? ''), app)
  })
}
