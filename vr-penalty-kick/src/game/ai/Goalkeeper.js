/**
 * Goalkeeper.js — 守門員 AI
 * 三回合難度遞增的撲救邏輯 + 3D 模型 + 動畫
 */
import * as THREE from 'three'
import { GOAL_WIDTH, GOAL_HEIGHT, GOAL_Z } from '../scene/Stadium.js'

export class Goalkeeper {
  constructor(scene) {
    this.scene = scene
    this.group = new THREE.Group()
    this.group.position.set(0, 0, GOAL_Z + 0.5)

    this._buildModel()
    scene.add(this.group)

    // AI state
    this.diving = false
    this.diveTarget = 0
    this.diveVelocity = 0

    // 三回合難度設定
    this.difficultyLevels = [
      { reactionMs: 350, accuracy: 0.4, diveRange: 1.8 }, // Round 1 — 較慢反應
      { reactionMs: 250, accuracy: 0.55, diveRange: 2.2 }, // Round 2 — 中等
      { reactionMs: 150, accuracy: 0.7, diveRange: 2.8 }, // Round 3 — 高難度
    ]
  }

  _buildModel() {
    // Body
    const bodyGeo = new THREE.CapsuleGeometry(0.25, 0.8, 4, 8)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00e5a0, roughness: 0.6 })
    this.body = new THREE.Mesh(bodyGeo, bodyMat)
    this.body.position.y = 1.0
    this.group.add(this.body)

    // Head
    const headGeo = new THREE.SphereGeometry(0.18, 12, 12)
    const headMat = new THREE.MeshStandardMaterial({ color: 0xf5c5a3, roughness: 0.7 })
    this.head = new THREE.Mesh(headGeo, headMat)
    this.head.position.y = 1.65
    this.group.add(this.head)

    // Arms
    const armGeo = new THREE.CapsuleGeometry(0.08, 0.5, 4, 6)
    const armMat = new THREE.MeshStandardMaterial({ color: 0x00e5a0, roughness: 0.6 })

    this.leftArm = new THREE.Mesh(armGeo, armMat)
    this.leftArm.position.set(-0.4, 1.2, 0)
    this.leftArm.rotation.z = Math.PI * 0.15
    this.group.add(this.leftArm)

    this.rightArm = new THREE.Mesh(armGeo, armMat)
    this.rightArm.position.set(0.4, 1.2, 0)
    this.rightArm.rotation.z = -Math.PI * 0.15
    this.group.add(this.rightArm)

    // Legs
    const legGeo = new THREE.CapsuleGeometry(0.1, 0.5, 4, 6)
    const legMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 })

    const leftLeg = new THREE.Mesh(legGeo, legMat)
    leftLeg.position.set(-0.15, 0.35, 0)
    this.group.add(leftLeg)

    const rightLeg = leftLeg.clone()
    rightLeg.position.x = 0.15
    this.group.add(rightLeg)

    // Gloves
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0xf5c842, roughness: 0.5 })
    const gloveGeo = new THREE.SphereGeometry(0.1, 8, 8)

    this.leftGlove = new THREE.Mesh(gloveGeo, gloveMat)
    this.leftGlove.position.set(-0.45, 1.55, 0)
    this.group.add(this.leftGlove)

    this.rightGlove = this.leftGlove.clone()
    this.rightGlove.position.x = 0.45
    this.group.add(this.rightGlove)

    this.group.castShadow = true
  }

  /**
   * 觸發撲救 AI — 判斷方向後延遲反應
   * @param {number} round - 當前回合 (0-indexed)
   * @param {number} targetX - 球的目標 X 座標
   */
  triggerDive(round, targetX) {
    const diff = this.difficultyLevels[Math.min(round, 2)]

    setTimeout(() => {
      this.diving = true
      // 根據準確率判斷是否猜對方向
      const guessCorrect = Math.random() < diff.accuracy
      const dir = Math.sign(targetX || (Math.random() - 0.5))
      this.diveTarget = (guessCorrect ? dir : -dir) * diff.diveRange
      this.diveVelocity = 0
    }, diff.reactionMs)
  }

  /**
   * 檢查是否撲救成功
   * @param {THREE.Vector3} ballPos
   * @returns {boolean}
   */
  checkSave(ballPos) {
    const goalieX = this.group.position.x
    const saveReach = 1.2
    return (
      Math.abs(ballPos.x - goalieX) < saveReach &&
      ballPos.y < GOAL_HEIGHT + 0.3
    )
  }

  /** 每幀更新動畫 */
  update(delta, elapsedTime) {
    if (this.diving) {
      // 撲救動畫
      this.diveVelocity +=
        (this.diveTarget - this.group.position.x) * 8 * delta
      this.diveVelocity *= 0.9
      this.group.position.x += this.diveVelocity * delta * 60
      this.group.position.x = THREE.MathUtils.clamp(
        this.group.position.x,
        -GOAL_WIDTH / 2 + 0.3,
        GOAL_WIDTH / 2 - 0.3
      )

      const diveAmount = Math.abs(this.diveVelocity) * 0.3
      this.group.rotation.z =
        -Math.sign(this.diveVelocity) * Math.min(diveAmount, 0.8)
      this.leftArm.rotation.z = Math.PI * 0.15 + diveAmount * 2
      this.rightArm.rotation.z = -Math.PI * 0.15 - diveAmount * 2
      this.leftArm.position.y = 1.2 + diveAmount * 0.5
      this.rightArm.position.y = 1.2 + diveAmount * 0.5
    } else {
      // 待機晃動
      this.group.position.x = Math.sin(elapsedTime * 1.5) * 0.6
      this.leftArm.rotation.z = Math.PI * 0.15 + Math.sin(elapsedTime * 2) * 0.1
      this.rightArm.rotation.z =
        -Math.PI * 0.15 - Math.sin(elapsedTime * 2) * 0.1
    }
  }

  /** 重置守門員位置與狀態 */
  reset() {
    this.diving = false
    this.diveTarget = 0
    this.diveVelocity = 0
    this.group.position.set(0, 0, GOAL_Z + 0.5)
    this.group.rotation.z = 0
    this.leftArm.rotation.z = Math.PI * 0.15
    this.rightArm.rotation.z = -Math.PI * 0.15
    this.leftArm.position.y = 1.2
    this.rightArm.position.y = 1.2
  }

  /** 從場景移除 */
  dispose(scene) {
    scene.remove(this.group)
  }
}
