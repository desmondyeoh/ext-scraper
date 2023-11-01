// Unique ID for the className.
var MOUSE_VISITED_CLASSNAME = "crx_mouse_visited";

// Previous dom, that we want to track, so we can remove the previous styling.
var prevDOM = null;

var generateQuerySelector = function (el) {
  if (el.tagName.toLowerCase() == "html") return "HTML";
  var str = el.tagName;
  str += el.id != "" ? "#" + el.id : "";
  if (el.className) {
    var classes = el.className.split(/\s/);
    for (var i = 0; i < classes.length; i++) {
      str += "." + classes[i];
    }
  }
  return str;
};

var genSelectorPair = function (el) {
  return (
    generateQuerySelector(el.parentNode) + " > " + generateQuerySelector(el)
  );
};

// Mouse listener for any move event on the current document.
document.addEventListener(
  "mousemove",
  (e) => {
    // let srcElement = e.srcElement;
    let srcElement = e.target;
    console.log(genSelectorPair(srcElement));

    // Lets check if our underlying element is a IMG.
    //  && srcElement.nodeName == 'IMG'
    if (prevDOM != srcElement) {
      // For NPE checking, we check safely. We need to remove the class name
      // Since we will be styling the new one after.
      if (prevDOM != null) {
        chrome.runtime.sendMessage(
          { type: "msg_from_content", value: genSelectorPair(prevDOM) },
          function (response) {
            console.log("visited", response);
          }
        );
        prevDOM.classList.remove(MOUSE_VISITED_CLASSNAME);
        // console.log(prevDOM.classList)
      }

      // Add a visited class name to the element. So we can style it.
      srcElement.classList.add(MOUSE_VISITED_CLASSNAME);

      // The current element is now the previous. So we can remove the class
      // during the next ieration.
      prevDOM = srcElement;
      // console.info(srcElement.currentSrc);
      // console.dir(srcElement);
    }
  },
  false
);

// listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request["type"] == "msg_from_popup") {
    console.log("msgi receive from popup", request["value"]);

    sendResponse("msg received and sending back reply"); // this is how you send message to popup
  } else {
    console.log("ELSE: msg receive from popup");
  }
  return true; // this make sure sendResponse will work asynchronously
});
