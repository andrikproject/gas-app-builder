/**
 * GAS App Builder - Background Service Worker
 */

// Install handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('✅ GAS App Builder terinstal!');
    // Open options page on install
    chrome.runtime.openOptionsPage();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage();
  }
  
  if (message.type === 'SHOW_NOTIFICATION') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'GAS App Builder',
      message: message.text,
      priority: 2
    });
  }
});
