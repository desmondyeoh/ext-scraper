chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "OFF",
  });
});

const extensions = 'https://developer.chrome.com/docs/extensions'
const webstore = 'https://developer.chrome.com/docs/webstore'

chrome.action.onClicked.addListener(async (tab) => {
  chrome.action.onClicked.addListener(function(tab) {
    chrome.windows.create({
      // Just use the full URL if you need to open an external page
      url: chrome.runtime.getURL("hello.html"),
      type: "popup"
    });
  });


  // chrome.scripting.executeScript({
  //   target : {tabId : tab.id},
  //   func : injectedFunction,
  // });
  // if (tab.url.startsWith(extensions) || tab.url.startsWith(webstore)) {
  //   // Retrieve the action badge to check if the extension is 'ON' or 'OFF'
  //   const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
  //   // Next state will always be the opposite
  //   const nextState = prevState === 'ON' ? 'OFF' : 'ON'

  //   // Set the action badge to the next state
  //   await chrome.action.setBadgeText({
  //     tabId: tab.id,
  //     text: nextState,
  //   });

  //   if (nextState === "ON") {
  //     // Insert the CSS file when the user turns the extension on
  //     await chrome.scripting.insertCSS({
  //       files: ["focus-mode.css"],
  //       target: { tabId: tab.id },
  //     });
  //   } else if (nextState === "OFF") {
  //     // Remove the CSS file when the user turns the extension off
  //     await chrome.scripting.removeCSS({
  //       files: ["focus-mode.css"],
  //       target: { tabId: tab.id },
  //     });
  //   }
  // }
});

function injectedFunction() {
  x = document.getElementsByClassName('language-js')
  alert('hix' + JSON.stringify(x));

}