window.onload = () => {
  // Unique ID for the className.
  var MOUSE_VISITED_CLASSNAME = "crx_mouse_visited";
  let IS_INSPECTING = false;

  // Previous dom, that we want to track, so we can remove the previous styling.
  var prevDOM = null;

  var getSelectorStr = function (el) {
    // if (el === null) {
    //   return null;
    // }
    // console.log("ELEMENT!!", el, el.tagName);
    if (el.tagName.toLowerCase() == "html") return "HTML";
    var str = el.tagName;
    str += el.id != "" ? "#" + el.id : "";
    if (el.className) {
      var classes = el.className.trim().split(/\s+/);

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

  var getSelectorStrRecursive = function (el) {
    const curSelectorStr = getSelectorStr(el);

    if (curSelectorStr === "HTML") {
      return "HTML";
    }

    return getSelectorStrRecursive(el.parentNode) + " > " + curSelectorStr;
  };

  function inspectElement(e) {
    // let srcElement = e.srcElement;
    let srcElement = e.target;
    const selectorPair = getSelectorStrRecursive(srcElement);

    if (prevDOM != srcElement) {
      // For NPE checking, we check safely. We need to remove the class name
      // Since we will be styling the new one after.
      if (prevDOM != null) {
        // prevDOM.classList.remove(MOUSE_VISITED_CLASSNAME);
        // console.log(prevDOM.classList)
        document
          .querySelectorAll(getSelectorStrRecursive(prevDOM))
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
    e.stopPropagation();

    let selectorPair = getSelectorStrRecursive(e.target);
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
    sendResponse("ack:" + request["type"]);
    switch (request["type"]) {
      case "msg.popup.inspect": {
        document.addEventListener("mousemove", inspectElement);
        document.addEventListener("click", selectElement);
        IS_INSPECTING = true;
        break;
      }
      case "msg.popup.execute": {
        const scriptAst = request["value"];
        console.log(scriptAst);
        const result = runScript(scriptAst);
        console.log(result);
      }
      default:
        console.log("content.invalidMsgType", request["type"]);
        break;
    }
    return true; // this make sure sendResponse will work asynchronously
  });
};

function runScript(ast, selector = document) {
  let i = 0;
  const result = [];

  while (i < ast.length) {
    const [cmd] = ast[i];
    switch (cmd) {
      case "foreach": {
        const [_cmd, selectorStr, childrenAst] = ast[i];
        const parentSelectors = selector.querySelectorAll(selectorStr);
        const inner = [];
        for (let j = 0; parentSelectors.length; j++) {
          inner.push(runScript(childrenAst, parentSelectors[j]));
        }
        result.push(inner);
        break;
      }
      case "text": {
        const [_cmd, selectorStr] = ast[i];
        console.log("selectorStr", selectorStr);
        const text = selector.querySelector(selectorStr).innerText;
        result.push(text);
        break;
      }
      case "click": {
        const [_cmd, selectorStr] = ast[i];
        result.push(cmd + " " + selectorStr);
        break;
      }
      default:
        throw new Error("unhandled cmd:" + cmd);
    }
    i++;
  }
  return result;
}
