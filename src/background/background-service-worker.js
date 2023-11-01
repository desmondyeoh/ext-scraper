chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "OFF",
  });
});

// const extensions = "https://developer.chrome.com/docs/extensions";
// const webstore = "https://developer.chrome.com/docs/webstore";

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// SIDE PANEL: show on specific pages only
// chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
//   if (!tab.url) return;

//   const url = new URL(tab.url);

//   if (url.origin === 'https://example.com') {
//     chrome.sidePanel.setOptions({ tabId, path: 'sidepanel.html', enabled: true });
//   } else {
//     chrome.sidePanel.setOptions({ tabId, enabled: false });
//   }
// });

// not used because default_action was set
// chrome.action.onClicked.addListener(async (tab) => {
//   chrome.windows.create(
//     {
//       focused: true,
//       left: 0,
//       width: 450,
//       // setSelfAsOpener: true,
//       type: "popup",
//       url: "hello.html",
//     },
//     () => {
//       console.log("hellooooo");
//     }
//   );
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
// });
