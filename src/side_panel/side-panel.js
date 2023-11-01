console.log("This is a popup!");

const startBtn = document.getElementById("startBtn");
const outputDiv = document.getElementById("output");
startBtn.onclick = async function () {
  // inject content script
  // const currTab = await getCurrentTab();
  // chrome.scripting.insertCSS({
  //   target: { tabId: currTab.id },
  //   files: ["src/side_panel/test.css"],
  // });
  // chrome.scripting
  //   .executeScript({
  //     target: { tabId: currTab.id },
  //     files: ["src/side_panel/jquery-3.7.1.min.js"],
  //   })
  //   .then(() => {
  //     chrome.scripting.executeScript({
  //       target: { tabId: currTab.id },
  //       func: csMain,
  //       args: [csGetArg()],
  //     });
  //   });
  outputDiv.innerText = "hi there";
};

// document.addEventListener("DOMContentLoaded", function () {
//   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//     chrome.tabs.sendMessage(
//       tabs[0].id,
//       { type: "msg_from_popup", value: },
//       function (response) {
//         alert(response);
//       }
//     );
//   });
// });

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

function csGetArg() {
  return 1;
}

function csMain(a) {
  // Unique ID for the className.
  var MOUSE_VISITED_CLASSNAME = "crx_mouse_visited";

  // Previous dom, that we want to track, so we can remove the previous styling.
  var prevDOM = null;

  // var genQuerySelector = function (el) {
  //   if (el.tagName.toLowerCase() == "html") return "HTML";
  //   var str = el.tagName;
  //   str += el.id != "" ? "#" + el.id : "";
  //   if (el.className) {
  //     var classes = el.className.split(/\s/);
  //     for (var i = 0; i < classes.length; i++) {
  //       str += "." + classes[i];
  //     }
  //   }
  //   return str;
  // };

  // var genSelectorPair = function (el) {
  //   return genQuerySelector(el.parentNode) + " > " + genQuerySelector(el);
  // };

  // Mouse listener for any move event on the current document.
  // document.addEventListener(
  //   "mousemove",
  //   (e) => {
  //     // let srcElement = e.srcElement;
  //     let srcElement = e.target;
  //     console.log(genPair(srcElement));

  //     // Lets check if our underlying element is a IMG.
  //     //  && srcElement.nodeName == 'IMG'
  //     if (prevDOM != srcElement) {
  //       // For NPE checking, we check safely. We need to remove the class name
  //       // Since we will be styling the new one after.
  //       if (prevDOM != null) {
  //         prevDOM.classList.remove(MOUSE_VISITED_CLASSNAME);
  //         // console.log(prevDOM.classList)
  //         chrome.tabs.sendMessage(
  //           tabs[0].id,
  //           { type: "msg_from_popup", value: genSelectorPair(el) },
  //           function (response) {
  //             alert(genSelectorPair(el));
  //           }
  //         );
  //       }

  //       // Add a visited class name to the element. So we can style it.
  //       srcElement.classList.add(MOUSE_VISITED_CLASSNAME);

  //       // The current element is now the previous. So we can remove the class
  //       // during the next ieration.
  //       prevDOM = srcElement;
  //       // console.info(srcElement.currentSrc);
  //       // console.dir(srcElement);
  //     }
  //   },
  //   false
  // );

  // listener
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request["type"] == "msg_from_popup") {
      console.log("msg receive from popup");

      sendResponse("msg received and sending back reply"); // this is how you send message to popup
    }
    return true; // this make sure sendResponse will work asynchronously
  });
}