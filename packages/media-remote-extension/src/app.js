'use strict'

//
// The app script handles bidirectional communication with the background
// script from the Metastream application.
//
;(function app() {
  const isInstalled = typeof document.documentElement.dataset.extensionInstalled !== 'undefined'
  if (isInstalled) {
    console.warn(`Metastream already initialized, is the extension installed twice?`)
    return
  }

  if (window.self !== window.top) {
    console.warn('Metastream is unsupported within subframes.')
    return
  }

  // Notify background script of initialization request
  chrome.runtime.sendMessage({ type: 'metastream-init' }, initialized => {
    document.documentElement.dataset.extensionInstalled = ''
    console.debug(`[Metastream Remote] Initialized`, initialized)
  })

  // Listen for subframe events
  chrome.runtime.onMessage.addListener(message => {
    if (typeof message !== 'object' || typeof message.type !== 'string') return

    if (message.type.startsWith('metastream-')) {
      console.debug('[Metastream Remote] Received message', message)

      // Send to main world
      message.__internal = true
      window.postMessage(message, location.origin)
    }
  })

  // Listen for events to forward to background script
  window.addEventListener('message', event => {
    const { data: action } = event
    if (typeof action !== 'object' || typeof action.type !== 'string' || action.__internal) return

    if (action.type.startsWith('metastream-')) {
      console.debug('[Metastream Remote] Forwarding message to background', action)
      chrome.runtime.sendMessage(action)
    }
  })
})()
