console.log("This is a popup!");

const startBtn = document.getElementById("startBtn");
const outputDiv = document.getElementById("output");
startBtn.onclick = async function () {
  const currTab = await getCurrentTab();
  chrome.scripting.executeScript({
    target: { tabId: currTab.id },
    files: ["runScript.js"],
  });
  outputDiv.innerText = "hi there";
};

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
