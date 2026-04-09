/**
 * Stadium.js — 足球場場景
 * 包含球場草皮、線條、罰球區、球門、觀眾看台
 */
import * as THREE from 'three'

// 球門常數（FIFA 標準）
export const GOAL_WIDTH = 7.32
export const GOAL_HEIGHT = 2.44
export const GOAL_DEPTH = 2
export const GOAL_Z = -20
export const PENALTY_SPOT_Z = -9
export const POST_RADIUS = 0.06

export class Stadium {
  constructor(scene) {
    this.scene = scene
    this.goalParts = []

    this._createPitch()
    this._createPitchLines()
    this._createGoal()
    this._createStands()
  }

  // ─── 草皮 ───
  _createPitch() {
    const geo = new THREE.PlaneGeometry(70, 100, 1, 1)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2d8a4e,
      roughness: 0.9,
      metalness: 0,
    })
    const pitch = new THREE.Mesh(geo, mat)
    pitch.rotation.x = -Math.PI / 2
    pitch.receiveShadow = true
    this.scene.add(pitch)
  }

  // ─── 球場線條 ───
  _createPitchLines() {
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
    })

    const createLine = (x, z, w, h) => {
      const geo = new THREE.PlaneGeometry(w, h)
      const line = new THREE.Mesh(geo, lineMat)
      line.rotation.x = -Math.PI / 2
      line.position.set(x, 0.01, z)
      this.scene.add(line)
    }

    // Penalty box
    createLine(0, -8, 32, 0.12)
    createLine(0, -20, 32, 0.12)
    createLine(-16, -14, 0.12, 12)
    createLine(16, -14, 0.12, 12)

    // Goal area
    createLine(0, -15, 14, 0.12)
    createLine(0, -20, 14, 0.12)
    createLine(-7, -17.5, 0.12, 5)
    createLine(7, -17.5, 0.12, 5)

    // Penalty spot
    const spotGeo = new THREE.CircleGeometry(0.15, 16)
    const spotMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const spot = new THREE.Mesh(spotGeo, spotMat)
    spot.rotation.x = -Math.PI / 2
    spot.position.set(0, 0.02, PENALTY_SPOT_Z)
    this.scene.add(spot)

    // Arc at top of penalty area
    const arcGeo = new THREE.RingGeometry(6, 6.1, 32, 1, Math.PI * 0.7, Math.PI * 0.6)
    const arc = new THREE.Mesh(arcGeo, lineMat)
    arc.rotation.x = -Math.PI / 2
    arc.position.set(0, 0.01, -8)
    this.scene.add(arc)
  }

  // ─── 球門 ───
  _createGoal() {
    const postMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.7,
      roughness: 0.2,
    })

    const createPost = (x, y, z, height, horizontal = false) => {
      const geo = horizontal
        ? new THREE.CylinderGeometry(POST_RADIUS, POST_RADIUS, GOAL_WIDTH, 8)
        : new THREE.CylinderGeometry(POST_RADIUS, POST_RADIUS, height, 8)
      const post = new THREE.Mesh(geo, postMat)
      if (horizontal) post.rotation.z = Math.PI / 2
      post.position.set(x, y, z)
      post.castShadow = true
      this.scene.add(post)
      this.goalParts.push(post)
      return post
    }

    // Uprights + crossbar
    createPost(-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, GOAL_Z, GOAL_HEIGHT)
    createPost(GOAL_WIDTH / 2, GOAL_HEIGHT / 2, GOAL_Z, GOAL_HEIGHT)
    createPost(0, GOAL_HEIGHT, GOAL_Z, 0, true)

    // Depth supports
    const supportGeo = new THREE.CylinderGeometry(
      POST_RADIUS * 0.7,
      POST_RADIUS * 0.7,
      GOAL_DEPTH,
      6
    )
    const supportL = new THREE.Mesh(supportGeo, postMat)
    supportL.rotation.x = Math.PI / 2
    supportL.position.set(-GOAL_WIDTH / 2, GOAL_HEIGHT, GOAL_Z - GOAL_DEPTH / 2)
    this.scene.add(supportL)

    const supportR = supportL.clone()
    supportR.position.x = GOAL_WIDTH / 2
    this.scene.add(supportR)

    // Nets
    const netMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      wireframe: true,
      side: THREE.DoubleSide,
    })

    // Back net
    const netBack = new THREE.Mesh(
      new THREE.PlaneGeometry(GOAL_WIDTH, GOAL_HEIGHT, 12, 4),
      netMat
    )
    netBack.position.set(0, GOAL_HEIGHT / 2, GOAL_Z - GOAL_DEPTH)
    this.scene.add(netBack)

    // Top net
    const netTop = new THREE.Mesh(
      new THREE.PlaneGeometry(GOAL_WIDTH, GOAL_DEPTH, 12, 3),
      netMat
    )
    netTop.rotation.x = Math.PI / 2
    netTop.position.set(0, GOAL_HEIGHT, GOAL_Z - GOAL_DEPTH / 2)
    this.scene.add(netTop)

    // Side nets
    const netSideGeo = new THREE.PlaneGeometry(GOAL_DEPTH, GOAL_HEIGHT, 3, 4)
    const netLeft = new THREE.Mesh(netSideGeo, netMat)
    netLeft.rotation.y = Math.PI / 2
    netLeft.position.set(-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, GOAL_Z - GOAL_DEPTH / 2)
    this.scene.add(netLeft)

    const netRight = netLeft.clone()
    netRight.position.x = GOAL_WIDTH / 2
    this.scene.add(netRight)
  }

  // ─── 觀眾看台 ───
  _createStands() {
    const createStand = (x, z, w, rotY) => {
      const geo = new THREE.BoxGeometry(w, 6, 4)
      const mat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.9 })
      const stand = new THREE.Mesh(geo, mat)
      stand.position.set(x, 2, z)
      stand.rotation.y = rotY
      this.scene.add(stand)

      // Crowd dots
      const colors = [0xe24b4a, 0xf5c842, 0x00b8d4, 0xff6b35, 0x9b59b6, 0xffffff]
      for (let i = 0; i < 40; i++) {
        const dotGeo = new THREE.SphereGeometry(0.1, 4, 4)
        const dotMat = new THREE.MeshBasicMaterial({
          color: colors[Math.floor(Math.random() * colors.length)],
        })
        const dot = new THREE.Mesh(dotGeo, dotMat)
        dot.position.set(
          (Math.random() - 0.5) * (w - 1),
          3 + Math.random() * 2.5,
          (Math.random() - 0.5) * 2
        )
        stand.add(dot)
      }
    }

    createStand(0, -35, 50, 0)
    createStand(-30, -5, 40, Math.PI / 2)
    createStand(30, -5, 40, -Math.PI / 2)
  }
}
