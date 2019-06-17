export default function(params, callback) {

  const ViewerToolbarButtonManager = class {

    constructor(viewer, options) {
      this.viewer = viewer;
      window.Autodesk.Viewing.Extension.call(this, viewer, options);
    }

    load() {
      if (this.viewer.toolbar) {
        // Toolbar is already available, create the UI
        this.createUI();
      } else {
        // Toolbar hasn't been created yet, wait until we get notification of its creation
        this.onToolbarCreatedBinded = this.onToolbarCreated.bind(this);
        this.viewer.addEventListener(av.TOOLBAR_CREATED_EVENT, this
          .onToolbarCreatedBinded);
      }

      return true;
    }


    onToolbarCreated() {
      this.viewer.removeEventListener(av.TOOLBAR_CREATED_EVENT, this
        .onToolbarCreatedBinded);
      this.onToolbarCreatedBinded = null;
      this.createUI();
    }

    createUI() {
      // var viewer = this.viewer;

      // Button 1
      var button = new window.Autodesk.Viewing.UI.Button(params.name);
      button.onClick = () => {
        callback();
      };

      var icon = button.container.firstChild;
      icon.className =
        "adsk-button-icon md-icon md-icon-font md-theme-default";

      icon.innerHTML = params.icon;

      if (typeof params.label !== "undefined")
        button.setToolTip(params.label);

      this.subToolbar = this.viewer.toolbar.getControl(
        params.subToolbarName
      );

      if (!this.subToolbar) {
        console.log("params.subToolbarName", params.subToolbarName);
        this.subToolbar = new window.Autodesk.Viewing.UI.ControlGroup(
          params.subToolbarName
        );

        this.subToolbar.addControl(button);

        this.viewer.toolbar.addControl(this.subToolbar);
      } else {
        this.subToolbar.addControl(button);

      }
    }


    unload() {
      this.viewer.toolbar.removeControl(this.subToolbar);
      return true;
    }

    // registerExtension(name, className) {
    //   window.Autodesk.Viewing.theExtensionManager.registerExtension(
    //     name,
    //     className
    //   );
    // }

  }
  return ViewerToolbarButtonManager;
}