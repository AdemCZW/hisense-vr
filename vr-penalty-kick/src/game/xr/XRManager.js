/**
 * XRManager.js — WebXR Session 管理
 * 負責 VR session 啟動/結束、XR controller 偵測
 * 展場場景：進入遊戲時自動請求 immersive-vr session
 */
import { VRButton } from 'three/addons/webxr/VRButton.js'

export class XRManager {
  constructor(renderer) {
    this.renderer = renderer
    this.supported = false
    this.sessionActive = false
    this._onSessionStart = null
    this._onSessionEnd = null

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
  onSessionStart(fn) {
    this._onSessionStart = fn
  }

  onSessionEnd(fn) {
    this._onSessionEnd = fn
  }

  /**
   * 建立 VR 進入按鈕（Three.js 內建）
   * @returns {HTMLElement|null}
   */
  createVRButton() {
    if (!this.supported) return null

    const btn = VRButton.createButton(this.renderer)

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

  /** 取得 XR controllers */
  getControllers() {
    return [
      this.renderer.xr.getController(0),
      this.renderer.xr.getController(1),
    ]
  }

  /** 是否目前在 VR session 中 */
  get isInVR() {
    return this.renderer.xr.isPresenting
  }
}
