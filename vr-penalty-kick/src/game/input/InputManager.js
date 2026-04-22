/**
 * InputManager.js — 輸入管理器
 * 桌面模式：滑鼠移動視角 + 點擊踢球
 * VR 模式：雙控制器追蹤（左手→左腳、右手→右腳）+ trigger 踢球
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

    // XR 管理器（由外部注入）
    this.xrManager = null

    // XR 控制器位置（投影到螢幕座標，供 Vue overlay 使用）
    this.xrLeftScreen = { x: 0, y: 0 }
    this.xrRightScreen = { x: 0, y: 0 }
    this._prevTriggerR = false

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

    // 事件處理函數（保存引用以便移除）
    this._onMouseMove = (e) => {
      if (!this.isPointerLocked || this.isXR) return
      this.yaw -= e.movementX * this.sensitivity
      this.pitch -= e.movementY * this.sensitivity
      this.yaw = THREE.MathUtils.clamp(this.yaw, -this.yawLimit, this.yawLimit)
      this.pitch = THREE.MathUtils.clamp(this.pitch, -this.pitchLimit, this.pitchLimit)
    }

    this._onClick = () => {
      if (this.isXR) return
      if (!this.isPointerLocked) {
        this.renderer.domElement.requestPointerLock()
        return
      }
      if (this._onKick) {
        this._onKick(this.aimPoint.x, this.aimPoint.y)
      }
    }

    this._onPointerLockChange = () => {
      this.isPointerLocked = !!document.pointerLockElement
    }

    this._eventsBound = false
  }

  /** 設定 XR 管理器 */
  setXRManager(xrManager) {
    this.xrManager = xrManager
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

  bindDesktopEvents() {
    if (this._eventsBound) return
    document.addEventListener('mousemove', this._onMouseMove)
    document.addEventListener('click', this._onClick)
    document.addEventListener('pointerlockchange', this._onPointerLockChange)
    this._eventsBound = true
  }

  /** 更新瞄準（從視線中心 raycast） */
  updateAim() {
    if (this.isXR && this.xrManager) {
      // VR 模式：用右手控制器射線瞄準球門
      this._updateXRAim()
      return
    }

    // 桌面模式：從攝影機正中心發射射線
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

  /** VR 模式：用頭部視線瞄準 */
  _updateXRAim() {
    // 用頭盔視線中心做 raycast
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera)
    const hits = this.raycaster.intersectObject(this.aimPlane)

    if (hits.length > 0) {
      this.aimPoint.x = THREE.MathUtils.clamp(hits[0].point.x, -GOAL_WIDTH / 2, GOAL_WIDTH / 2)
      this.aimPoint.y = THREE.MathUtils.clamp(hits[0].point.y, 0.3, GOAL_HEIGHT)
      this.aimRing.position.x = this.aimPoint.x
      this.aimRing.position.y = this.aimPoint.y
      this.aimRing.visible = true
    }
  }

  /** 更新 XR 控制器（每幀呼叫） */
  updateXRControllers() {
    if (!this.isXR || !this.xrManager) return

    // 更新控制器世界位置
    const positions = this.xrManager.updateControllers()
    if (!positions) return

    // 將 3D 世界座標投影到螢幕座標（供 Vue overlay 使用）
    const w = window.innerWidth
    const h = window.innerHeight

    const projL = positions.left.clone().project(this.camera)
    this.xrLeftScreen.x = (projL.x * 0.5 + 0.5) * w
    this.xrLeftScreen.y = (-projL.y * 0.5 + 0.5) * h

    const projR = positions.right.clone().project(this.camera)
    this.xrRightScreen.x = (projR.x * 0.5 + 0.5) * w
    this.xrRightScreen.y = (-projR.y * 0.5 + 0.5) * h

    // 檢查右手 trigger 踢球
    const btns = this.xrManager.getButtonStates()
    if (btns.right?.trigger && !this._prevTriggerR) {
      // trigger 剛按下
      if (this._onKick) {
        this._onKick(this.aimPoint.x, this.aimPoint.y)
      }
    }
    this._prevTriggerR = btns.right?.trigger || false
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
    this.updateXRControllers()

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
    document.removeEventListener('mousemove', this._onMouseMove)
    document.removeEventListener('click', this._onClick)
    document.removeEventListener('pointerlockchange', this._onPointerLockChange)
    if (document.pointerLockElement) {
      document.exitPointerLock()
    }
  }
}
