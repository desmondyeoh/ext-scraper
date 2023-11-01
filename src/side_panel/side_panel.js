console.log("This is a popup!");

const startBtn = document.getElementById("startBtn");
const outputDiv = document.getElementById("output");
startBtn.onclick = async function () {
  // inject content script
  const currTab = await getCurrentTab();
  chrome.scripting.executeScript({
    target: { tabId: currTab.id },
    func: csHello,
    args: [csGetArg()],
  });
  outputDiv.innerText = "hi there";
};

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

function csGetArg() {
  return 1;
}
function csHello(a) {
  console.log("num" + a);
}
