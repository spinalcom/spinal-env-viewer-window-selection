function SpinalWindowSelection(viewer, options) {
  window.Autodesk.Viewing.Extension.call(this, viewer, options);
}

SpinalWindowSelection.prototype = Object.create(window.Autodesk.Viewing
  .Extension
  .prototype);
SpinalWindowSelection.prototype.constructor = SpinalWindowSelection;

SpinalWindowSelection.prototype.load = function() {
  if (this.viewer.toolbar) {
    this.createUI();
  } else {
    this.onToolbarCreatedBinded = this.onToolbarCreated.bind(this);
    this.viewer.addEventListener(av.TOOLBAR_CREATED_EVENT, this
      .onToolbarCreatedBinded);
  }
  return true;
};

SpinalWindowSelection.prototype.onToolbarCreated = function() {
  this.viewer.removeEventListener(av.TOOLBAR_CREATED_EVENT, this
    .onToolbarCreatedBinded);
  this.onToolbarCreatedBinded = null;
  this.createUI();
};

SpinalWindowSelection.prototype.unload = function() {
  alert('SpinalWindowSelection is now unloaded!');
  return true;
};

SpinalWindowSelection.prototype.createUI = function() {
  var viewer = this.viewer;

  // Button 1
  var selectionBtn = new window.Autodesk.Viewing.UI.Button(
    'window selection');
  selectionBtn.onClick = function(e) {
    console.log("click window selection")
  };

  var icon = selectionBtn.container.firstChild;
  icon.className = "adsk-button-icon md-icon md-icon-font md-theme-default";
  icon.innerHTML = this.cfg.toolbar.icon;

  selectionBtn.addClass('my-view-front-button');
  selectionBtn.setToolTip('View front');


  this.subToolbar = new window.Autodesk.Viewing.UI.ControlGroup(
    'my-custom-view-toolbar');
  this.subToolbar.addControl(selectionBtn);


  viewer.toolbar.addControl(this.subToolbar);
};

window.Autodesk.Viewing.theExtensionManager.registerExtension(
  'SpinalWindowSelection',
  SpinalWindowSelection);