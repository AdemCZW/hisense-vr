/**
 * XRManager.js — WebXR Session 管理
 * 負責 VR session 啟動/結束、XR controller 偵測
 * 支援雙手控制器追蹤（左手→左腳、右手→右腳）
 */
import * as THREE from 'three'
import { VRButton } from 'three/addons/webxr/VRButton.js'

export class XRManager {
  constructor(renderer) {
    this.renderer = renderer
    this.supported = false
    this.sessionActive = false
    this._onSessionStart = null
    this._onSessionEnd = null

    // 雙控制器
    this.controllerL = null // 左手
    this.controllerR = null // 右手
    this.gripL = null
    this.gripR = null

    // 控制器世界位置（每幀更新）
    this.leftPos = new THREE.Vector3()
    this.rightPos = new THREE.Vector3()

    this._checkSupport()
  }

  async _checkSupport() {
    if (!navigator.xr) {
      this.supported = false
      return
    }
    try {
      this.supported = await navigator.xr.isSessionSupported('immersive-vr')
    } catch {
      this.supported = false
    }
  }

  /** 監聽 session 事件 */
  onSessionStart(fn) { this._onSessionStart = fn }
  onSessionEnd(fn) { this._onSessionEnd = fn }

  /**
   * 建立 VR 進入按鈕（Three.js 內建）
   * @returns {HTMLElement|null}
   */
  createVRButton() {
    // 直接用 Three.js VRButton，它內部會處理支援檢測
    const btn = VRButton.createButton(this.renderer)

    // 初始化控制器
    this._setupControllers()

    this.renderer.xr.addEventListener('sessionstart', () => {
      this.sessionActive = true
      if (this._onSessionStart) this._onSessionStart()
    })

    this.renderer.xr.addEventListener('sessionend', () => {
      this.sessionActive = false
      if (this._onSessionEnd) this._onSessionEnd()
    })

    return btn
  }

  /** 初始化雙控制器 */
  _setupControllers() {
    // controller 0 & 1（handedness 由 XR session 決定）
    this.controllerL = this.renderer.xr.getController(0)
    this.controllerR = this.renderer.xr.getController(1)
    this.gripL = this.renderer.xr.getControllerGrip(0)
    this.gripR = this.renderer.xr.getControllerGrip(1)

    // 連線事件 — 根據 handedness 重新指派
    this.controllerL.addEventListener('connected', (e) => {
      this._assignHandedness(0, e.data)
    })
    this.controllerR.addEventListener('connected', (e) => {
      this._assignHandedness(1, e.data)
    })
  }

  /** 根據 XRInputSource 的 handedness 指派左右手 */
  _assignHandedness(index, inputSource) {
    const hand = inputSource.handedness // 'left' | 'right' | 'none'
    console.log(`[XR] Controller ${index} connected: ${hand}`)

    if (hand === 'left') {
      this.controllerL = this.renderer.xr.getController(index)
      this.gripL = this.renderer.xr.getControllerGrip(index)
    } else if (hand === 'right') {
      this.controllerR = this.renderer.xr.getController(index)
      this.gripR = this.renderer.xr.getControllerGrip(index)
    }
  }

  /** 手動請求進入 VR */
  async enterVR() {
    if (!this.supported) {
      console.warn('WebXR VR not supported')
      return false
    }

    try {
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
      })
      this.renderer.xr.setSession(session)
      return true
    } catch (err) {
      console.error('Failed to enter VR:', err)
      return false
    }
  }

  /** 結束 VR session */
  async exitVR() {
    const session = this.renderer.xr.getSession()
    if (session) {
      await session.end()
    }
  }

  /**
   * 每幀更新控制器位置
   * 回傳 { left: Vector3, right: Vector3 } 世界座標
   */
  updateControllers() {
    if (!this.isInVR) return null

    if (this.controllerL) {
      this.controllerL.getWorldPosition(this.leftPos)
    }
    if (this.controllerR) {
      this.controllerR.getWorldPosition(this.rightPos)
    }

    return { left: this.leftPos, right: this.rightPos }
  }

  /**
   * 取得控制器的 squeeze（握拳）和 trigger 狀態
   */
  getButtonStates() {
    const session = this.renderer.xr.getSession()
    if (!session) return { left: null, right: null }

    const states = { left: null, right: null }

    for (const source of session.inputSources) {
      const gp = source.gamepad
      if (!gp) continue

      const data = {
        trigger: gp.buttons[0]?.pressed || false,
        squeeze: gp.buttons[1]?.pressed || false,
        thumbstick: gp.axes.length >= 4
          ? { x: gp.axes[2], y: gp.axes[3] }
          : { x: 0, y: 0 },
      }

      if (source.handedness === 'left') states.left = data
      else if (source.handedness === 'right') states.right = data
    }

    return states
  }

  /** 將控制器加到場景中（可視化用） */
  addToScene(scene) {
    if (this.controllerL) scene.add(this.controllerL)
    if (this.controllerR) scene.add(this.controllerR)
    if (this.gripL) scene.add(this.gripL)
    if (this.gripR) scene.add(this.gripR)
  }

  /** 是否目前在 VR session 中 */
  get isInVR() {
    return this.renderer.xr.isPresenting
  }
}
