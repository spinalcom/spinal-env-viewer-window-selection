///////////////////////////////////////////////////////////
// SelectSet util for Selection Window in Forge Viewer
// By Philippe Leefsma, September 2017
//
///////////////////////////////////////////////////////////
import geometryIntersectsBox3 from './GeometryIntersectsBox3'
import Toolkit from './viewer.toolkit'

export default class SelectSet {

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  constructor(viewer) {

    this.viewer = viewer;
  }


  ///////////////////////////////////////////////////////////
  //Filter an Object
  //
  ///////////////////////////////////////////////////////////

  filterLeafIds(leafIds, hiddenIds) {

    return leafIds.map(leaft => {

      let modelFoundInHidden = hiddenIds.find(el => el.model.id === leaft
        .model.id);

      if (modelFoundInHidden) {
        leaft.ids = leaft.ids.filter(el => {
          return modelFoundInHidden.ids.indexOf(el) === -1;
        })
      }

      return leaft;

    })

  }



  /////////////////////////////////////////////////////////
  // Set model: required to compute the bounding boxes
  //
  /////////////////////////////////////////////////////////
  async setModel(models) {

    this.model = models

    const instanceTree = models.map(model => {
      return {
        model: model,
        instanceTree: model.getData().instanceTree
      }
    });

    const rootIds = instanceTree.map(el => {
      return {
        model: el.model,
        rootId: el.instanceTree.getRootId()
      }
    })

    const bboxRes = await Promise.all(rootIds.map(async obj => {
      return {
        model: obj.model,
        bbox: await this.getComponentBoundingBox(obj.model, obj
          .rootId)
      }
    }))



    this.boundingSphere = bboxRes.map(el => {
      return {
        model: el.model,
        boundingSphere: el.bbox.getBoundingSphere()
      }
    })




    // let leafIds = await Toolkit.getLeafNodes(model);

    let leafIds = await Promise.all(models.map(async model => {
      return {
        model: model,
        ids: await Toolkit.getLeafNodes(model)
      }
    }))

    let isolatedNodes = this.viewer.getAggregateIsolation();
    let hiddenNodes = this.viewer.getAggregateHiddenNodes();

    if (isolatedNodes.length > 0) {

      leafIds = await Promise.all(isolatedNodes.map(async el => {
        return {
          model: el.model,
          ids: await Toolkit.getLeafNodes(el.model, el.ids)
        }
      }));

    } else if (hiddenNodes.length > 0) {
      let allNodesHidden = await Promise.all(hiddenNodes.map(async hidden => {
        return {
          model: hidden.model,
          ids: await Toolkit.getLeafNodes(hidden.model, hidden.ids)
        }
      }));

      leafIds = this.filterLeafIds(leafIds, allNodesHidden);
    }


    this.boundingBoxInfo = leafIds.map((el) => {

      el.ids = el.ids.map(dbId => {
        const bbox = this.getLeafComponentBoundingBox(
          el.model, dbId)

        return {
          bbox,
          dbId
        }
      })

      return el;

    })
  }

  /////////////////////////////////////////////////////////
  // Returns bounding box as it appears in the viewer
  // (transformations could be applied)
  //
  /////////////////////////////////////////////////////////
  getModifiedWorldBoundingBox(fragIds, fragList) {

    const fragbBox = new window.THREE.Box3()
    const nodebBox = new window.THREE.Box3()

    fragIds.forEach(function(fragId) {

      fragList.getWorldBounds(fragId, fragbBox)

      nodebBox.union(fragbBox)
    })

    return nodebBox
  }

  /////////////////////////////////////////////////////////
  // Returns bounding box for fragment list
  //
  /////////////////////////////////////////////////////////
  async getComponentBoundingBox(model, dbId) {

    const fragIds = await Toolkit.getFragIds(
      model, dbId)

    const fragList = model.getFragmentList()

    return this.getModifiedWorldBoundingBox(
      fragIds, fragList)
  }

  getLeafComponentBoundingBox(model, dbId) {

    const fragIds = Toolkit.getLeafFragIds(
      model, dbId)


    const fragList = model.getFragmentList()

    return this.getModifiedWorldBoundingBox(
      fragIds, fragList)
  }

  /////////////////////////////////////////////////////////
  // Creates Raycaster object from the mouse pointer
  //
  /////////////////////////////////////////////////////////
  pointerToRay(pointer) {

    const camera = this.viewer.navigation.getCamera()
    const pointerVector = new window.THREE.Vector3()
    const rayCaster = new window.THREE.Raycaster()
    const pointerDir = new window.THREE.Vector3()
    const domElement = this.viewer.canvas

    const rect = domElement.getBoundingClientRect()

    const x = ((pointer.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((pointer.clientY - rect.top) / rect.height) * 2 + 1

    if (camera.isPerspective) {

      pointerVector.set(x, y, 0.5)

      pointerVector.unproject(camera)

      rayCaster.set(camera.position,
        pointerVector.sub(
          camera.position).normalize())

    } else {

      pointerVector.set(x, y, -15)

      pointerVector.unproject(camera)

      pointerDir.set(0, 0, -1)

      rayCaster.set(pointerVector,
        pointerDir.transformDirection(
          camera.matrixWorld))
    }

    return rayCaster.ray
  }

  /////////////////////////////////////////////////////////
  // Returns true if the box is contained inside the
  // closed volume defined by the the input planes
  //
  /////////////////////////////////////////////////////////
  containsBox(planes, box) {

    const {
      min,
      max
    } = box

    const vertices = [
      new window.THREE.Vector3(min.x, min.y, min.z),
      new window.THREE.Vector3(min.x, min.y, max.z),
      new window.THREE.Vector3(min.x, max.y, max.z),
      new window.THREE.Vector3(max.x, max.y, max.z),
      new window.THREE.Vector3(max.x, max.y, min.z),
      new window.THREE.Vector3(max.x, min.y, min.z),
      new window.THREE.Vector3(min.x, max.y, min.z),
      new window.THREE.Vector3(max.x, min.y, max.z)
    ]

    for (let vertex of vertices) {

      for (let plane of planes) {

        if (plane.distanceToPoint(vertex) < 0) {

          return false
        }
      }
    }

    return true
  }

  /////////////////////////////////////////////////////////
  // Returns true if at least one vertex is contained in
  // closed volume defined by the the input planes
  //
  /////////////////////////////////////////////////////////
  containsVertex(planes, vertices) {

    for (let vertex of vertices) {

      let isInside = true

      for (let plane of planes) {

        if (plane.distanceToPoint(vertex) < 0) {

          isInside = false
          break
        }
      }

      if (isInside) {

        return true
      }
    }

    return false
  }

  /////////////////////////////////////////////////////////
  // Returns the oriented camera plane
  //
  /////////////////////////////////////////////////////////
  getCameraPlane() {

    const camera = this.viewer.navigation.getCamera()

    const normal = camera.target.clone().sub(
      camera.position).normalize()

    const pos = camera.position

    const dist = -normal.x * pos.x -
      normal.y * pos.y -
      normal.z * pos.z

    return new window.THREE.Plane(normal, dist)
  }

  /////////////////////////////////////////////////////////
  // Creates pyramid geometry to perform tri-box
  // intersection analysis
  //
  /////////////////////////////////////////////////////////
  createPyramidGeometry(vertices) {

    var geometry = new window.THREE.Geometry()

    geometry.vertices = vertices

    geometry.faces = [
      new window.THREE.Face3(0, 1, 2),
      new window.THREE.Face3(0, 2, 3),
      new window.THREE.Face3(1, 0, 4),
      new window.THREE.Face3(2, 1, 4),
      new window.THREE.Face3(3, 2, 4),
      new window.THREE.Face3(0, 3, 4)
    ]

    return geometry
  }

  /////////////////////////////////////////////////////////
  // Determine if the bounding boxes are
  // inside, outside or intersect with the selection window
  //
  /////////////////////////////////////////////////////////
  filterBoundingBoxes(planes, vertices, partialSelect) {

    const geometry = this.createPyramidGeometry(vertices)

    const intersect = []
    const outside = []
    const inside = []

    return this.boundingBoxInfo.map(res => {
      for (let bboxInfo of res.ids) {

        // if bounding box inside, then we can be sure
        // the mesh is inside too

        if (this.containsBox(planes, bboxInfo.bbox)) {

          inside.push(bboxInfo)

        } else if (partialSelect) {

          // otherwise need a more precise tri-box
          // analysis to determine if the bbox intersect
          // the pyramid geometry

          const intersects = geometryIntersectsBox3(
            geometry, bboxInfo.bbox)

          intersects.length ?
            intersect.push(bboxInfo) :
            outside.push(bboxInfo)

        } else {

          outside.push(bboxInfo)
        }
      }

      return {
        model: res.model,
        intersect,
        outside,
        inside
      }
    })


  }

  /////////////////////////////////////////////////////////
  // Runs the main logic of the select set:
  // computes a pyramid shape from the selection window
  // corners and determines enclosed meshes from the model
  //
  /////////////////////////////////////////////////////////

  compute(pointer1, pointer2, partialSelect) {

    // build 4 rays to project the 4 corners
    // of the selection window

    const xMin = Math.min(pointer1.clientX, pointer2.clientX)
    const xMax = Math.max(pointer1.clientX, pointer2.clientX)

    const yMin = Math.min(pointer1.clientY, pointer2.clientY)
    const yMax = Math.max(pointer1.clientY, pointer2.clientY)

    const ray1 = this.pointerToRay({
      clientX: xMin,
      clientY: yMin
    })

    const ray2 = this.pointerToRay({
      clientX: xMax,
      clientY: yMin
    })

    const ray3 = this.pointerToRay({
      clientX: xMax,
      clientY: yMax
    })

    const ray4 = this.pointerToRay({
      clientX: xMin,
      clientY: yMax
    })

    // first we compute the top of the pyramid
    const top = new window.THREE.Vector3(0, 0, 0)

    top.add(ray1.origin)
    top.add(ray2.origin)
    top.add(ray3.origin)
    top.add(ray4.origin)

    top.multiplyScalar(0.25)

    // we use the bounding sphere to determine
    // the height of the pyramid

    return this.boundingSphere.map(res => {



      const {
        center,
        radius
      } = res.boundingSphere

      // compute distance from pyramid top to center
      // of bounding sphere

      const dist = new window.THREE.Vector3(
        top.x - center.x,
        top.y - center.y,
        top.z - center.z)

      // compute height of the pyramid:
      // to make sure we go far enough,
      // we add the radius of the bounding sphere

      const height = radius + dist.length()

      // compute the length of the side edges

      const angle = ray1.direction.angleTo(
        ray2.direction)

      const length = height / Math.cos(angle * 0.5)

      // compute bottom vertices

      const v1 = new window.THREE.Vector3(
        ray1.origin.x + ray1.direction.x * length,
        ray1.origin.y + ray1.direction.y * length,
        ray1.origin.z + ray1.direction.z * length)

      const v2 = new window.THREE.Vector3(
        ray2.origin.x + ray2.direction.x * length,
        ray2.origin.y + ray2.direction.y * length,
        ray2.origin.z + ray2.direction.z * length)

      const v3 = new window.THREE.Vector3(
        ray3.origin.x + ray3.direction.x * length,
        ray3.origin.y + ray3.direction.y * length,
        ray3.origin.z + ray3.direction.z * length)

      const v4 = new window.THREE.Vector3(
        ray4.origin.x + ray4.direction.x * length,
        ray4.origin.y + ray4.direction.y * length,
        ray4.origin.z + ray4.direction.z * length)

      // create planes

      const plane1 = new window.THREE.Plane()
      const plane2 = new window.THREE.Plane()
      const plane3 = new window.THREE.Plane()
      const plane4 = new window.THREE.Plane()
      const plane5 = new window.THREE.Plane()

      plane1.setFromCoplanarPoints(top, v1, v2)
      plane2.setFromCoplanarPoints(top, v2, v3)
      plane3.setFromCoplanarPoints(top, v3, v4)
      plane4.setFromCoplanarPoints(top, v4, v1)
      plane5.setFromCoplanarPoints(v3, v2, v1)

      const planes = [
        plane1, plane2,
        plane3, plane4,
        plane5
      ]

      const vertices = [
        v1, v2, v3, v4, top
      ]

      // filter all bounding boxes to determine
      // if inside, outside or intersect

      const result = this.filterBoundingBoxes(
        planes, vertices, partialSelect)


      return result.map(res => {
        let obj = {
          model: res.model,
          dbIds: []
        }

        const dbIdsInside = res.inside.map((bboxInfo) => {
          return bboxInfo.dbId
        })

        // if partialSelect = true
        // we need to return the intersect bboxes

        if (partialSelect) {

          const dbIdsIntersect = res.intersect.map((bboxInfo) => {
            return bboxInfo.dbId
          })

          // At this point perform a finer analysis
          // to determine if the any of the mesh vertices are inside
          // or outside the selection window but it would
          // be a much more expensive computation

          //const dbIdsIntersectAccurate =
          //  dbIdsIntersect.filter((dbId) => {
          //
          //    const geometry =
          //      Toolkit.buildComponentGeometry(
          //        this.viewer, this.viewer.model, dbId)
          //
          //    return this.containsVertex(
          //      planes, geometry.vertices)
          //  })

          let ids = [...dbIdsInside, ...dbIdsIntersect];

          obj.dbIds = ids;
          return obj;
        }

        obj.dbIds = dbIdsInside;
        return obj;

      })

    })
  }
}