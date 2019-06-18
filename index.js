import extensionName from "./js/selection";

import SpinalWindowSelection from "./js/createToolbar";

const TOOLBAR_GROUP_NAME = "spinalcom";


const EXTENSION_NAME = "spinal-window-selection";

let extension;

// document.addEventListener('keydown', function(event) {
//   extension = typeof extension === "undefined" ? window.spinal.ForgeViewer
//     .viewer
//     .getExtension(extensionName) : extension;

//   if (event.altKey && event.ctrlKey) {
//     extension.startSelection();
//   }

// })

// document.addEventListener('keyup', function(event) {
//   if (typeof extension !== "undefined" && (event.keyCode === 17 || event
//       .keyCode === 18)) {
//     extension.disableSelectionMode();
//   }
// })


const windowSelection = SpinalWindowSelection({
  name: "spinal-window-selection",
  icon: "crop_free",
  label: "window selection",
  subToolbarName: TOOLBAR_GROUP_NAME
}, () => {
  extension = typeof extension === "undefined" ? window.spinal.ForgeViewer
    .viewer
    .getExtension(extensionName) : extension;

  if (!extension.active) {
    extension.startSelection();
  } else {
    extension.disableSelectionMode();
  }

});

window.Autodesk.Viewing.theExtensionManager.registerExtension(
  EXTENSION_NAME,
  windowSelection
);

window.spinal.ForgeExtentionManager.addExtention(EXTENSION_NAME);