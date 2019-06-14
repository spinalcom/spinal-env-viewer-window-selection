module.exports = function() {
  return {

    createExtention(option) {
      const cfg = option;

      const SpinalForgeExtention = class {
        constructor(viewer, options) {

          window.Autodesk.Viewing.Extension.call(this, viewer, options);
          this.viewer = viewer;
          this.panel = null;
          this.cfg = cfg;
        }


        load() {
          if (typeof cfg.toolbar !== "undefined") {
            // add toolbar
            if (this.viewer.toolbar) {
              createToolbar.call(this);
            } else {
              this.onToolbarCreatedBinded = onToolbarCreated.bind(this);
              this.viewer.addEventListener(
                window.av.TOOLBAR_CREATED_EVENT,
                this.onToolbarCreatedBinded
              );
            }
          }
          if (typeof cfg.onLoad !== "undefined") cfg.onLoad.call(this);
          return true;
        }
        /**
         * method called when the viewer unload of the extention
         * (managed by the autodesk viewer)
         */
        unload() {
          if (typeof cfg.toolbar !== "undefined") {
            this.viewer.subToolbar.removeControl(this.toolbarButton);
          }
          if (typeof cfg.onUnLoad !== "undefined") cfg.onUnLoad.call(
            this);
          return true;
        }

        /**
         *
         * @param {*} option
         */
        openPanel(option) {
          const panel = getPanel.call(this);
          panel.setVisible(true);
          try {
            this.component.opened.call(this.component, option, this
              .viewer);
          } catch (e) {
            console.error(e);
          }
        }
        /**
         *
         *
         * @param {*} option
         */
        closePanel(option) {
          const panel = getPanel.call(this);
          panel.setVisible(false);
        }
        /**
         *
         *
         * @param {*} option
         */
        tooglePanel(option) {
          if (this.panel === null || this.panel.isVisible() === false) {
            this.openPanel.call(this, option);
          } else {
            this.closePanel.call(this, option);
          }
        }
      };
      return SpinalForgeExtention;
    },

    /**
     * Method to register an extention to the viewer and the forge viewer
     * @param {string} name name of the extention
     * @param {*} classExtention an extention created by `createExtention`
     */
    registerExtention(name, classExtention) {
      // register to forge
      window.Autodesk.Viewing.theExtensionManager.registerExtension(
        name,
        classExtention
      );
      // register to viewer
      window.spinal.ForgeExtentionManager.addExtention(name);
    }
  };
};