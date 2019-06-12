import extensionName from "./js/selection";
let extension;

document.addEventListener('keydown', function(event) {
  console.log("event", event)
  extension = typeof extension === "undefined" ? window.spinal.ForgeViewer
    .viewer
    .getExtension(extensionName) : extension;

  if (event.altKey && event.ctrlKey) {
    extension.startSelection();
  }

})

document.addEventListener('keyup', function(event) {
  if (typeof extension !== "undefined" && (event.keyCode === 17 || event
      .keyCode === 18)) {
    extension.disableSelectionMode();
  }
})