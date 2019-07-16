import SelectionWindowTool from "../extensions/Viewing.Extension.SelectionWindow.Tool";
// import Toolkit from '../extensions/viewer.toolkit';
// import MultiModelExtensionBase from '../extensions/Viewer.MultiModelExtensionBase';

class SelectionComponent {

  constructor(viewer) {
    this.viewer = viewer;
  }

  load() {
    this.selection = null;
    this.active = false;

    // this.viewer.loadExtension(
    //   'Viewing.Extension.ContextMenu', {
    //     buildMenu: (menu) => {
    //       return menu.map((item) => {
    //         const title = item.title.toLowerCase()
    //         if (title === 'show all objects') {
    //           return {
    //             title: 'Show All objects',
    //             target: () => {
    //               Toolkit.isolateFull(this.viewer)
    //               this.viewer.fitToView()
    //             }
    //           }
    //         }
    //         return item
    //       })
    //     }
    //   })

    this.onModelRootLoaded();

    this.onModelActivated(this.viewer);


    return true

  }

  get className() {

    return 'selection-window'
  }

  /////////////////////////////////////////////////////////
  // Extension Id
  //
  /////////////////////////////////////////////////////////
  static get ExtensionId() {
    return 'Viewing.Extension.SelectionWindow'
  }

  /////////////////////////////////////////////////////////
  // Unload callback
  //
  /////////////////////////////////////////////////////////
  unload() {


    this.selectionWindowTool.off()

    super.unload()

    return true
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  onModelRootLoaded() {

    this.selectionWindowTool =
      new SelectionWindowTool(this.viewer)

    this.selectionWindowTool.on('deactivate', () => {
      this.active = false;
    })

    this.selectionWindowTool.on('activate', () => {
      this.active = true;
    })

    this.selectionWindowTool.on('selection',
      (selection) => {

        this.viewer.impl.selector.setSelection(
          selection.dbIds,
          selection.model)

        this.selection = selection;
      })


    this.viewer.addEventListener(window.Autodesk.Viewing.VIEWER_INITIALIZED,
      () => {

        this.viewer.toolController.registerTool(
          this.selectionWindowTool)
      })

  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  onModelActivated(event) {

    this.selectionWindowTool.setModel(event.model)
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  setPartialSelect(partialSelect) {

    this.selectionWindowTool.setPartialSelect(partialSelect)
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  startSelection() {

    this.selection = null;

    this.viewer.toolController.activateTool(
      this.selectionWindowTool.getName())
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  disableSelectionMode() {
    this.selectionWindowTool.deactivate();
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////

  onNodeClicked(node) {

    const model = node.model

    if (model) {

      switch (node.type) {

        case 'component':
          this.viewer.impl.selector.setSelection(
            [node.id],
            model)
          break

        case 'root':
          this.viewer.impl.selector.setSelection(
            node.props.childIds,
            model)
          break
      }
    }
  }

}


window.Autodesk.Viewing.theExtensionManager.registerExtension(
  SelectionComponent.ExtensionId,
  SelectionComponent)

window.spinal.ForgeExtentionManager.addExtention(
  'Viewing.Extension.SelectionWindow')

export default 'Viewing.Extension.SelectionWindow'