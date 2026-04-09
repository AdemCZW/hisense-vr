/**
 * InputManager.js — 輸入管理器
 * 桌面模式：滑鼠移動視角 + 點擊踢球
 * VR 模式：頭盔視線瞄準 + controller/腿部感測器踢球
 */
import * as THREE from 'three'
import { GOAL_WIDTH, GOAL_HEIGHT, GOAL_Z } from '../scene/Stadium.js'

export class InputManager {
  constructor(camera, renderer) {
    this.camera = camera
    this.renderer = renderer
    this.raycaster = new THREE.Raycaster()
    this.aimPoint = new THREE.Vector3(0, 1.2, GOAL_Z + 0.15)
    this.isPointerLocked = false
    this.isXR = false

    // 第一人稱視角控制
    this.yaw = 0
    this.pitch = -0.08
    this.sensitivity = 0.002
    this.pitchLimit = Math.PI * 0.35
    this.yawLimit = Math.PI * 0.4

    // 瞄準平面（不可見，用於 raycast）
    const aimGeo = new THREE.PlaneGeometry(GOAL_WIDTH * 1.5, GOAL_HEIGHT * 2)
    const aimMat = new THREE.MeshBasicMaterial({ visible: false })
    this.aimPlane = new THREE.Mesh(aimGeo, aimMat)
    this.aimPlane.position.set(0, GOAL_HEIGHT / 2 + 0.5, GOAL_Z)

    // 3D 瞄準環
    const ringGeo = new THREE.RingGeometry(0.18, 0.24, 24)
    this.aimRingMat = new THREE.MeshBasicMaterial({
      color: 0x00e5a0,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    })
    this.aimRing = new THREE.Mesh(ringGeo, this.aimRingMat)
    this.aimRing.position.copy(this.aimPoint)

    // 瞄準中心點
    const dotGeo = new THREE.CircleGeometry(0.06, 12)
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x00e5a0, side: THREE.DoubleSide })
    this.aimRing.add(new THREE.Mesh(dotGeo, dotMat))

    // 事件回調
    this._onKick = null

    // 綁定事件
    this._bindDesktopEvents()
  }

  /** 加到場景 */
  addToScene(scene) {
    scene.add(this.aimPlane)
    scene.add(this.aimRing)
  }

  /** 設定踢球回調 */
  onKick(callback) {
    this._onKick = callback
  }

  _bindDesktopEvents() {
    // 滑鼠移動控制視角
    document.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked || this.isXR) return
      this.yaw -= e.movementX * this.sensitivity
      this.pitch -= e.movementY * this.sensitivity
      this.yaw = THREE.MathUtils.clamp(this.yaw, -this.yawLimit, this.yawLimit)
      this.pitch = THREE.MathUtils.clamp(this.pitch, -this.pitchLimit, this.pitchLimit)
    })

    // 點擊：先鎖定滑鼠，鎖定後才踢球
    document.addEventListener('click', () => {
      if (this.isXR) return
      if (!this.isPointerLocked) {
        this.renderer.domElement.requestPointerLock()
        return
      }
      // Pointer lock 狀態下 = 踢球
      if (this._onKick) {
        this._onKick(this.aimPoint.x, this.aimPoint.y)
      }
    })

    // Pointer lock 狀態追蹤
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = !!document.pointerLockElement
    })
  }

  /** 更新瞄準（從視線中心 raycast） */
  updateAim() {
    // 從攝影機正中心發射射線
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera)
    const hits = this.raycaster.intersectObject(this.aimPlane)

    if (hits.length > 0) {
      this.aimPoint.x = THREE.MathUtils.clamp(
        hits[0].point.x,
        -GOAL_WIDTH / 2,
        GOAL_WIDTH / 2
      )
      this.aimPoint.y = THREE.MathUtils.clamp(
        hits[0].point.y,
        0.3,
        GOAL_HEIGHT
      )
      this.aimRing.position.x = this.aimPoint.x
      this.aimRing.position.y = this.aimPoint.y
      this.aimRing.visible = true
    } else {
      this.aimRing.visible = false
    }
  }

  /** 更新攝影機旋轉（桌面第一人稱） */
  updateCamera() {
    if (this.isXR) return
    this.camera.rotation.order = 'YXZ'
    this.camera.rotation.y = this.yaw
    this.camera.rotation.x = this.pitch
  }

  /** 每幀更新（在 animate loop 中呼叫） */
  update(elapsedTime) {
    this.updateCamera()
    this.updateAim()

    // 瞄準環脈動動畫
    if (this.aimRing.visible) {
      this.aimRing.scale.setScalar(1 + Math.sin(elapsedTime * 4) * 0.1)
      this.aimRingMat.opacity = 0.5 + Math.sin(elapsedTime * 3) * 0.2
    }
  }

  /** 顯示/隱藏瞄準環 */
  setAimVisible(visible) {
    this.aimRing.visible = visible
  }

  /** 重置視角 */
  resetView() {
    this.yaw = 0
    this.pitch = -0.08
  }

  /** 從場景移除瞄準物件 */
  removeFromScene(scene) {
    scene.remove(this.aimPlane)
    scene.remove(this.aimRing)
  }

  dispose() {
    // cleanup if needed
  }
}
