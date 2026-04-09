/**
 * Football.js — 足球 3D 模型
 * 負責足球的 Three.js 視覺表現，與 Cannon-es 物理同步
 */
import * as THREE from 'three'

export class Football {
  constructor(scene) {
    this.scene = scene

    // 足球 mesh
    const ballGeo = new THREE.IcosahedronGeometry(0.22, 2)
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.1,
    })
    this.mesh = new THREE.Mesh(ballGeo, ballMat)
    this.mesh.position.set(0, 0.22, -9)
    this.mesh.castShadow = true

    // 足球花紋
    const pentGeo = new THREE.IcosahedronGeometry(0.225, 2)
    const pentMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.5,
      metalness: 0,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    })
    const pattern = new THREE.Mesh(pentGeo, pentMat)
    this.mesh.add(pattern)

    scene.add(this.mesh)
  }

  /**
   * 同步物理剛體的位置/旋轉到 Three.js mesh
   * @param {CANNON.Body} body
   */
  syncWithPhysics(body) {
    this.mesh.position.copy(body.position)
    this.mesh.quaternion.copy(body.quaternion)
  }

  /** 重置位置 */
  reset() {
    this.mesh.position.set(0, 0.22, -9)
    this.mesh.rotation.set(0, 0, 0)
  }

  /** 從場景移除並釋放資源 */
  dispose(scene) {
    scene.remove(this.mesh)
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
  }
}
