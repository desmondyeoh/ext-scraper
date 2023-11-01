console.log("This is a popup!");

const startBtn = document.getElementById("startBtn");
const outputDiv = document.getElementById("output");
startBtn.onclick = async function () {
  // inject content script
  const currTab = await getCurrentTab();
  chrome.scripting.insertCSS({
    target: { tabId: currTab.id },
    files: ['src/side_panel/test.css'],
  });
  chrome.scripting.executeScript({
    target: { tabId: currTab.id },
    files: ['src/side_panel/jquery-3.7.1.min.js'],
  }).then(() => {
    chrome.scripting.executeScript({
      target: { tabId: currTab.id },
      func: csHello,
      args: [csGetArg()],
    });
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
  alert("num" + a);




  // Mouse listener for any move event on the current document.
document.addEventListener('mousemove', function (e) {
  // let srcElement = e.srcElement;
  let srcElement = e.target;
  console.log('move', srcElement.classList);

  // Unique ID for the className.
  var MOUSE_VISITED_CLASSNAME = 'crx_mouse_visited';

  // Previous dom, that we want to track, so we can remove the previous styling.
  var prevDOM = null;
  
  // Lets check if our underlying element is a IMG.
  if (prevDOM != srcElement && srcElement.nodeName == 'IMG') {

      // For NPE checking, we check safely. We need to remove the class name
      // Since we will be styling the new one after.
      if (prevDOM != null) {
          prevDOM.classList.remove(MOUSE_VISITED_CLASSNAME);
      }

      // Add a visited class name to the element. So we can style it.
      srcElement.classList.add(MOUSE_VISITED_CLASSNAME);
  console.log('aft add', srcElement.classList);

      // The current element is now the previous. So we can remove the class
      // during the next ieration.
      prevDOM = srcElement;
      console.info(srcElement.currentSrc);
      console.dir(srcElement);
  }
}, false);
}
