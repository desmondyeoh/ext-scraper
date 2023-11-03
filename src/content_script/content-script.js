window.onload = () => {
  // Unique ID for the className.
  var MOUSE_VISITED_CLASSNAME = "crx_mouse_visited";
  let IS_INSPECTING = false;

  // Previous dom, that we want to track, so we can remove the previous styling.
  var prevDOM = null;

  var generateQuerySelector = function (el) {
    if (el.tagName.toLowerCase() == "html") return "HTML";
    var str = el.tagName;
    str += el.id != "" ? "#" + el.id : "";
    if (el.className) {
      var classes = el.className.split(/\s/);

      for (var i = 0; i < classes.length; i++) {
        // skip MOUSE_VISITED_CLASSNAME
        if (classes[i] === MOUSE_VISITED_CLASSNAME) {
          continue;
        }
        str += "." + classes[i];
      }
    }
    return str;
  };

  var getSelectorPair = function (el) {
    return (
      generateQuerySelector(el.parentNode) + " > " + generateQuerySelector(el)
    );
  };

  function inspectElement(e) {
    // let srcElement = e.srcElement;
    let srcElement = e.target;
    const selectorPair = getSelectorPair(srcElement);

    if (prevDOM != srcElement) {
      // For NPE checking, we check safely. We need to remove the class name
      // Since we will be styling the new one after.
      if (prevDOM != null) {
        // prevDOM.classList.remove(MOUSE_VISITED_CLASSNAME);
        // console.log(prevDOM.classList)
        document
          .querySelectorAll(getSelectorPair(prevDOM))
          .forEach((x) => x.classList.remove(MOUSE_VISITED_CLASSNAME));
      }

      // Add a visited class name to the element. So we can style it.
      // srcElement.classList.add(MOUSE_VISITED_CLASSNAME);

      // update all classnames
      document
        .querySelectorAll(selectorPair)
        .forEach((x) => x.classList.add(MOUSE_VISITED_CLASSNAME));

      chrome.runtime.sendMessage(
        { type: "msg.content.test", value: selectorPair },
        function (response) {
          console.log("visited", response);
        }
      );

      // The current element is now the previous. So we can remove the class
      // during the next ieration.
      prevDOM = srcElement;
    }
  }

  function selectElement(e) {
    e.preventDefault();

    let selectorPair = getSelectorPair(e.target);
    IS_INSPECTING = false;
    document.removeEventListener("mousemove", inspectElement);
    document.removeEventListener("click", selectElement);
    document
      .querySelectorAll(selectorPair)
      .forEach((x) => x.classList.remove(MOUSE_VISITED_CLASSNAME));
    chrome.runtime.sendMessage(
      {
        type: "msg.content.select_element",
        value: selectorPair,
      },
      function (response) {
        console.log("selected element", response);
      }
    );
  }

  // Mouse listener for any move event on the current document.

  // listener
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request["type"]) {
      case "msg.popup.inspect": {
        sendResponse("msg received and sending back reply"); // this is how you send message to popup
        document.addEventListener("mousemove", inspectElement);
        document.addEventListener("click", selectElement);
        IS_INSPECTING = true;
        break;
      }
      default:
        console.log("content.invalidMsgType", request["type"]);
        break;
    }
    return true; // this make sure sendResponse will work asynchronously
  });
};
