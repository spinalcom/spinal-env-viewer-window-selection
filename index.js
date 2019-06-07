import extensionName from "./js/selection";
let extension;

document.addEventListener('keydown', function(event) {
  extension = typeof extension === "undefined" ? window.spinal.ForgeViewer
    .viewer
    .getExtension(extensionName) : extension;

  if (event.keyCode === 17) {
    extension.startSelection();
  }

})

document.addEventListener('keyup', function(event) {
  if (typeof extension !== "undefined" && event.keyCode === 17) {
    extension.disableSelectionMode();
  }
})