// Unique ID for the className.
var MOUSE_VISITED_CLASSNAME = "crx_mouse_visited";
let IS_INSPECTING = false;
let SHOULD_RUN = true;
let IS_RUNNING = false;

window.onload = () => {
  // new page load - run if page refreshes AND run_forever is true
  // chrome.runtime.sendMessage({ type: "msg.content.maybe_run_on_load" });

  // Previous dom, that we want to track, so we can remove the previous styling.
  var prevDOM = null;

  var getSelectorStr = function (el) {
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
  chrome.runtime.onMessage.addListener(
    async (request, sender, sendResponse) => {
      switch (request["type"]) {
        case "msg.popup.inspect": {
          document.addEventListener("mousemove", inspectElement);
          document.addEventListener("click", selectElement);
          IS_INSPECTING = true;
          sendResponse("ack:" + request["type"]);
          break;
        }
        case "msg.popup.run": {
          IS_RUNNING = true;
          const scriptAst = request["value"];
          const isInfinite = request["options"]?.isInfinite ?? false;
          console.log("scriptAst", scriptAst);
          console.log("isInfinite", isInfinite);
          await genRunScript(scriptAst, { isInfinite });
          IS_RUNNING = false;
          sendResponse("done execution");
          break;
        }
        case "msg.popup.stop": {
          SHOULD_RUN = false;
          sendResponse("done stop");
          break;
        }
        default:
          console.log("content.invalidMsgType", request["type"]);
          sendResponse("ack:" + request["type"]);
          break;
      }
      return true; // this make sure sendResponse will work asynchronously
    }
  );
};

async function genRunScript(ast, options) {
  const { isInfinite } = options;
  do {
    // "Stop" is called, stop current run.
    if (!SHOULD_RUN) {
      SHOULD_RUN = true; // reset flag
      return;
    }
    // run
    const results = await genRunScriptOnce(ast, options);
    chrome.runtime.sendMessage({
      type: "msg.content.send_results",
      value: results,
    });
    // sleep 2 sec
    await genSleep(2000);
  } while (isInfinite);
}

async function genRunScriptOnce(ast, options) {
  const { selector = document } = options;
  let i = 0;
  const results = [];

  // run the AST
  while (i < ast.length) {
    const [cmd] = ast[i];
    switch (cmd) {
      case "//": {
        // comment, skip
        break;
      }
      case "click": {
        const [_cmd, selectorStr] = ast[i];
        document.querySelector(selectorStr).click();
        break;
      }
      case "foreach": {
        const [_cmd, selectorStr, childrenAst] = ast[i];
        const parentSelectors = selector.querySelectorAll(selectorStr);
        const inner = [];
        for (let j = 0; j < parentSelectors.length; j++) {
          // console.log("J", j);
          inner.push(
            await genRunScriptOnce(childrenAst, {
              ...options,
              selector: parentSelectors[j],
            })
          );
        }
        results.push(inner);
        break;
      }
      case "link": {
        const [_cmd, selectorStr] = ast[i];
        const link = selector.querySelector(selectorStr)?.href ?? "<null>";
        results.push(link);
        break;
      }
      case "text": {
        const [_cmd, selectorStr] = ast[i];
        const text =
          selectorStr === "$self"
            ? selector.innerText
            : selector.querySelector(selectorStr)?.innerText ?? "<null>";
        results.push(text);
        break;
      }
      case "wait": {
        const [_cmd, selectorStr] = ast[i];
        await genWaitForElementToExist(selectorStr);
        break;
      }
      default:
        throw new Error("unhandled cmd:" + cmd);
    }
    i++;
  }
  return results;
}

async function genWaitForElementToExist(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
    });
  });
}

async function genSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
