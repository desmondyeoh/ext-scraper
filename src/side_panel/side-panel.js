console.log("This is a popup!");

const outputDiv = document.getElementById("output");
let RUN_RESULTS = [];

document.getElementById("inspectBtn").onclick = async function () {
  const currTab = await getCurrentTab();
  chrome.tabs.sendMessage(
    currTab.id,
    { type: "msg.popup.inspect" },
    function (resText) {
      console.log("RESPONSE", resText);
    }
  );
  // inject content script
  // const currTab = await getCurrentTab();
  // chrome.scripting.insertCSS({
  //   target: { tabId: currTab.id },
  //   files: ["src/side_panel/test.css"],
  // });
  // chrome.scripting
  //   .runScript({
  //     target: { tabId: currTab.id },
  //     files: ["src/side_panel/jquery-3.7.1.min.js"],
  //   })
  //   .then(() => {
  //     chrome.scripting.runScript({
  //       target: { tabId: currTab.id },
  //       func: csMain,
  //       args: [csGetArg()],
  //     });
  //   });
  outputDiv.innerText = "(select an element from the browser)";
};

const saveBtn = document.getElementById("saveBtn");
saveBtn.onclick = async function () {
  chrome.storage.local.set({
    scriptField: document.getElementById("scriptField").value,
  });
};

const astizeBtn = document.getElementById("astizeBtn");
astizeBtn.onclick = async function () {
  const ast = createAST(document.getElementById("scriptField").value);
  document.getElementById("astField").value = JSON.stringify(ast, null, 2);
};

const loadBtn = document.getElementById("loadBtn");
loadBtn.onclick = async function () {
  // loadBtn.innerText = "Loading...";
  // loadBtn.disabled = true;
  chrome.storage.local.get(["scriptField"]).then((result) => {
    if (result == null) {
      return;
    }
    document.getElementById("scriptField").value = result.scriptField;
    // loadBtn.innerText = "Load";
    // loadBtn.disabled = false;
  });
};

// load button on page load
loadBtn.click();

const clearResultsBtn = document.getElementById("clearResultsBtn");
clearResultsBtn.onclick = function () {
  RUN_RESULTS = [];
  updateResultsUI();
};

const exportCSVBtn = document.getElementById("exportCSVBtn");
exportCSVBtn.onclick = function () {
  console.log("exportCSVBtn click");
  console.log(RUN_RESULTS.flat(2));
  exportCSV("test.csv", RUN_RESULTS.flat(2));
};

function exportCSV(filename, rows) {
  var processRow = function (row) {
    var finalVal = "";
    for (var j = 0; j < row.length; j++) {
      var innerValue = row[j] === null ? "" : row[j].toString();
      if (row[j] instanceof Date) {
        innerValue = row[j].toLocaleString();
      }
      var result = innerValue.replace(/"/g, '""');
      if (result.search(/("|,|\n)/g) >= 0) result = '"' + result + '"';
      if (j > 0) finalVal += ",";
      finalVal += result;
    }
    return finalVal + "\n";
  };

  var csvFile = "";
  for (var i = 0; i < rows.length; i++) {
    csvFile += processRow(rows[i]);
  }

  var blob = new Blob([csvFile], { type: "text/csv;charset=utf-8;" });
  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    var link = document.createElement("a");
    if (link.download !== undefined) {
      // feature detection
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
const stopBtn = document.getElementById("stopBtn");
stopBtn.onclick = async function () {
  const currTab = await getCurrentTab();
  chrome.tabs.sendMessage(currTab.id, {
    type: "msg.popup.stop",
  });
};

const runBtn = document.getElementById("runBtn");
runBtn.onclick = runScript;

async function runScript() {
  const currTab = await getCurrentTab();
  chrome.tabs.sendMessage(currTab.id, {
    type: "msg.popup.run",
    value: createAST(document.getElementById("scriptField").value),
    options: {
      isInfinite: document.getElementById("shouldRunInfinitely").checked,
    },
  });
}

function updateResultsUI() {
  const results = RUN_RESULTS;
  document.getElementById("resultsField").value = JSON.stringify(results);
  document.getElementById("resultsCount").innerText = results.length;
  // update table
  let html = "";
  for (let i = 0; i < results.length; i++) {
    // page
    for (let j = 0; j < results[i].length; j++) {
      // row
      for (let k = 0; k < results[i][j].length; k++) {
        html += "<tr>";
        for (let l = 0; l < results[i][j][k].length; l++) {
          html += "<td>" + results[i][j][k][l] + "</td>";
        }
        html += "</tr>";
      }
    }
  }
  document.getElementById("resultsTable").innerHTML = html;
}

function createAST(scriptStr) {
  return nestLoop(tokenizeScript(scriptStr));
}

function tokenizeScript(scriptField) {
  let script = scriptField.trim();
  let lines = script.split(/\n\s*/);
  lines = lines.map((lineStr) => {
    const line = lineStr.trim();
    const firstToken = line.substring(0, line.indexOf(" "));
    const rest = line.substring(line.indexOf(" ") + 1);
    // if no space, firstToken is empty string and rest will have the text
    return firstToken === "" ? [rest] : [firstToken, rest];
  });
  return lines;
}

function nestLoop(lines, i = 0) {
  const inner = [];
  while (i < lines.length) {
    const line = lines[i];
    const [cmd] = line;
    switch (cmd) {
      case "foreach":
        [i, nested] = nestLoop(lines, i + 1);
        line.push(nested);
        inner.push(line);
        break;
      case "endforeach":
        return [i, inner];
      default: // other tokens (e.g. text)
        inner.push(line);
    }
    i++;
  }
  return inner;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // const outputDiv = document.getElementById("output");
  console.log("onMessage:", request["type"]);
  switch (request["type"]) {
    case "msg.content.test": {
      console.log("msg receive from CONTENT", request["value"]);
      outputDiv.innerText = request["value"];
      sendResponse("msg received and sending back reply"); // this is how you send message to popup
      break;
    }
    case "msg.content.select_element": {
      const selectedElementSelector = request["value"];
      sendResponse(`selector: ${selectedElementSelector}`); // this is how you send message to popup
      break;
    }
    case "msg.content.maybe_run_on_load": {
      if (document.getElementById("shouldRunOnLoad").value) {
        sendResponse(`${request["type"]}: running script`);
        runScript();
      }
      sendResponse(`${request["type"]}: not running script`);
      break;
    }
    case "msg.content.send_results": {
      RUN_RESULTS.push(request["value"]);
      updateResultsUI();
      sendResponse(`${request["type"]}: received results`);
      break;
    }
    default:
      console.log("side-panel.invalidMsgType", request["type"]);
      sendResponse(`${request["type"]}: invalidMsgType`);
      break;
  }
  return true; // this make sure sendResponse will work asynchronously
});

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
  // var MOUSE_VISITED_CLASSNAME = "crx_mouse_visited";
  // Previous dom, that we want to track, so we can remove the previous styling.
  // var prevDOM = null;
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
}
