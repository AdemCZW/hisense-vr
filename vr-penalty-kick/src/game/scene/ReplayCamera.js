/**
 * ReplayCamera.js — 踢球後第三視角攝影機
 * 從側面/高處追蹤球的飛行路徑
 */
import * as THREE from 'three'

export class ReplayCamera {
  constructor(camera) {
    this.camera = camera
    this.active = false

    // 原始攝影機狀態（踢球前）
    this.savedPos = new THREE.Vector3()
    this.savedRot = new THREE.Euler()

    // 回放攝影機目標
    this.targetPos = new THREE.Vector3()
    this.lookAtTarget = new THREE.Vector3()

    // 平滑插值速度
    this.lerpSpeed = 2.5
  }

  /**
   * 開始回放視角
   * @param {THREE.Vector3} ballStartPos - 球起始位置
   * @param {number} targetX - 瞄準的 x 座標
   */
  start(ballStartPos, targetX) {
    // 保存當前攝影機狀態
    this.savedPos.copy(this.camera.position)
    this.savedRot.copy(this.camera.rotation)

    // 計算回放攝影機位置（側面偏高）
    // 偏向球飛行的反方向，這樣可以看到完整弧線
    const sideX = targetX > 0 ? -6 : 6
    this.targetPos.set(
      sideX,              // 側面偏移
      5,                  // 高度
      -14                 // 球路中間位置
    )

    this.lookAtTarget.set(0, 1.2, -18) // 看向球門方向

    this.active = true
  }

  /** 每幀更新 — 平滑移動到回放位置，追蹤球 */
  update(delta, ballPosition) {
    if (!this.active) return

    // 平滑移動攝影機到目標位置
    this.camera.position.lerp(this.targetPos, this.lerpSpeed * delta)

    // 看向球的位置（稍微偏向球門）
    const lookTarget = this.lookAtTarget.clone().lerp(
      new THREE.Vector3(ballPosition.x, ballPosition.y, ballPosition.z),
      0.6
    )
    this.camera.lookAt(lookTarget)
  }

  /** 結束回放，回到原始視角 */
  restore(duration = 600) {
    if (!this.active) return

    this.active = false
    const startPos = this.camera.position.clone()
    const startQuat = this.camera.quaternion.clone()

    // 計算目標四元數
    const tempCam = this.camera.clone()
    tempCam.position.copy(this.savedPos)
    tempCam.rotation.copy(this.savedRot)
    const endQuat = tempCam.quaternion.clone()

    const startTime = performance.now()

    const animate = () => {
      const elapsed = performance.now() - startTime
      const t = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3)

      this.camera.position.lerpVectors(startPos, this.savedPos, ease)
      this.camera.quaternion.slerpQuaternions(startQuat, endQuat, ease)

      if (t < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }
}
