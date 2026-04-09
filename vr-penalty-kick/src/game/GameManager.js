/**
 * GameManager.js — 遊戲管理器
 * 使用 App.vue 提供的共享 3D 場景
 * 控制遊戲流程：踢球 → 球飛行 → 判定進球 → 下一回合 → 結算
 */
import * as THREE from 'three'
import { GOAL_WIDTH, GOAL_HEIGHT, GOAL_Z } from './scene/Stadium.js'
import { Football } from './scene/Football.js'
import { Goalkeeper } from './ai/Goalkeeper.js'
import { PhysicsWorld } from './physics/PhysicsWorld.js'
import { InputManager } from './input/InputManager.js'
import { XRManager } from './xr/XRManager.js'

export class GameManager {
  /**
   * @param {object} sceneApi - App.vue 提供的共享場景 API
   * @param {object} store - Pinia game store instance
   */
  constructor(sceneApi, store) {
    this.store = store
    this.sceneApi = sceneApi
    this._resultChecked = false

    // 從共享場景取得引用
    this.scene = sceneApi.getScene()
    this.camera = sceneApi.getCamera()
    this.renderer = sceneApi.getRenderer()

    // 場景物件（Stadium 已由 App.vue 建立）
    this.football = new Football(this.scene)
    this.goalkeeper = new Goalkeeper(this.scene)

    // 物理
    this.physics = new PhysicsWorld()

    // 輸入
    this.input = new InputManager(this.camera, this.renderer)
    this.input.addToScene(this.scene)

    // 設定攝影機到罰球點第一人稱
    this.camera.position.set(0, 1.65, -8)

    // WebXR
    this.xr = new XRManager(this.renderer)

    // 踢球事件
    this.input.onKick((targetX, targetY) => {
      this._handleKick(targetX, targetY)
    })

    // 綁定更新回調
    this._updateBound = (delta, elapsed) => this._update(delta, elapsed)

    // 訊息回調
    this._onMessage = null
    this._onSpeedDisplay = null
    this._onGameEnd = null
  }

  // ─── 事件回調設定 ───

  onMessage(fn) { this._onMessage = fn }
  onSpeedDisplay(fn) { this._onSpeedDisplay = fn }
  onGameEnd(fn) { this._onGameEnd = fn }

  // ─── 遊戲控制 ───

  start() {
    this.sceneApi.onUpdate(this._updateBound)
    this._showMessage('READY', 'ready')
    setTimeout(() => this._hideMessage(), 1200)
  }

  reset() {
    this.store.resetAll()
    this.store.setScreen('game')
    this.store.gameStarted = true
    this.physics.resetBall()
    this.football.reset()
    this.goalkeeper.reset()
    this.input.setAimVisible(true)
    this.input.resetView()
    this._resultChecked = false

    this._showMessage('READY', 'ready')
    setTimeout(() => this._hideMessage(), 1200)
  }

  stop() {
    this.sceneApi.offUpdate(this._updateBound)
  }

  dispose() {
    this.sceneApi.offUpdate(this._updateBound)
    this.input.dispose()

    // 從共享場景移除遊戲物件
    this.football.dispose(this.scene)
    this.goalkeeper.dispose(this.scene)
    this.input.removeFromScene(this.scene)
  }

  // ─── 內部邏輯 ───

  _handleKick(targetX, targetY) {
    if (!this.store.ballReady || !this.store.hasNextRound) return

    const speed = 18 + Math.random() * 8
    const kmh = Math.round(speed * 3.6)

    this.store.kick(kmh, 0)
    this.physics.kickBall({ targetX, targetY, speed })
    this.input.setAimVisible(false)

    if (this._onSpeedDisplay) this._onSpeedDisplay(kmh)

    this.goalkeeper.triggerDive(this.store.round, targetX)
    this._resultChecked = false
  }

  _update(delta, elapsed) {
    this.physics.update(delta)
    this.football.syncWithPhysics(this.physics.ballBody)
    this.goalkeeper.update(delta, elapsed)
    this.input.update(elapsed)

    if (this.store.ballKicked && !this._resultChecked) {
      this._checkGoal()
    }
  }

  _checkGoal() {
    const ballPos = this.physics.ballBody.position
    const bx = ballPos.x
    const by = ballPos.y
    const bz = ballPos.z

    if (bz > GOAL_Z - 0.5 && bz < GOAL_Z + 0.5) {
      this._resultChecked = true
      const saved = this.goalkeeper.checkSave(new THREE.Vector3(bx, by, bz))
      const inGoal =
        Math.abs(bx) < GOAL_WIDTH / 2 &&
        by > 0 &&
        by < GOAL_HEIGHT

      if (inGoal && !saved) {
        this._onRoundEnd('goal')
      } else if (saved) {
        this._onRoundEnd('saved')
      } else {
        this._onRoundEnd('miss')
      }
      return
    }

    if (bz < GOAL_Z - 5 || Math.abs(bx) > 20 || by < -1) {
      this._resultChecked = true
      this._onRoundEnd('miss')
    }
  }

  _onRoundEnd(result) {
    if (result === 'goal') {
      this._showMessage('GOAL!', 'goal')
    } else if (result === 'saved') {
      this._showMessage('SAVED!', 'miss')
    } else {
      this._showMessage('MISS!', 'miss')
    }

    this.store.recordResult(result)

    setTimeout(() => {
      this._hideMessage()

      if (this.store.hasNextRound) {
        this.physics.resetBall()
        this.football.reset()
        this.goalkeeper.reset()
        this.store.readyNextRound()
        this.input.setAimVisible(true)

        this._showMessage('READY', 'ready')
        setTimeout(() => this._hideMessage(), 800)
      } else {
        if (this._onGameEnd) this._onGameEnd()
      }
    }, 1500)
  }

  _showMessage(text, type) {
    if (this._onMessage) this._onMessage(text, type)
  }

  _hideMessage() {
    if (this._onMessage) this._onMessage('', '')
  }
}
