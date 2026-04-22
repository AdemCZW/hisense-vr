/**
 * GameManager.js — 遊戲管理器
 * 使用 App.vue 提供的共享 3D 場景
 * 控制遊戲流程：踢球 → 球飛行（軌跡+回放視角） → 判定進球 → 下一回合 → 結算
 */
import * as THREE from 'three'
import { GOAL_WIDTH, GOAL_HEIGHT, GOAL_Z } from './scene/Stadium.js'
import { Football } from './scene/Football.js'
import { Goalkeeper } from './ai/Goalkeeper.js'
import { PhysicsWorld } from './physics/PhysicsWorld.js'
import { InputManager } from './input/InputManager.js'
import { XRManager } from './xr/XRManager.js'
import { BallTrail } from './scene/BallTrail.js'
import { ReplayCamera } from './scene/ReplayCamera.js'

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

    // WebXR — 使用 App.vue 提供的共享 XRManager
    this.xr = sceneApi.getXRManager?.() || new XRManager(this.renderer)
    this.input.setXRManager(this.xr)

    // 監聽 XR session，切換輸入模式
    this.xr.onSessionStart(() => { this.input.isXR = true })
    this.xr.onSessionEnd(() => { this.input.isXR = false })

    // 球軌跡特效
    this.ballTrail = new BallTrail(this.scene)

    // 回放攝影機
    this.replayCamera = new ReplayCamera(this.camera)

    // 踢球事件
    this.input.onKick((targetX, targetY) => {
      this._handleKick(targetX, targetY)
    })

    // 綁定更新回調
    this._updateBound = (delta, elapsed) => this._update(delta, elapsed)

    // 回調
    this._onMessage = null
    this._onSpeedDisplay = null
    this._onGameEnd = null
    this._onResult = null  // 物理判定結果回調
  }

  // ─── 事件回調設定 ───

  onMessage(fn) { this._onMessage = fn }
  onSpeedDisplay(fn) { this._onSpeedDisplay = fn }
  onGameEnd(fn) { this._onGameEnd = fn }
  onResult(fn) { this._onResult = fn }

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
    this.ballTrail.reset()
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
    this.ballTrail.dispose(this.scene)
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

    // 啟動球軌跡
    this.ballTrail.start()

    // 啟動回放攝影機（從側面追蹤球）
    const ballStartPos = this.physics.ballBody.position.clone()
    this.replayCamera.start(
      new THREE.Vector3(ballStartPos.x, ballStartPos.y, ballStartPos.z),
      targetX
    )
  }

  _update(delta, elapsed) {
    this.physics.update(delta)
    this.football.syncWithPhysics(this.physics.ballBody)
    this.goalkeeper.update(delta, elapsed)
    this.input.update(elapsed)

    // 更新球軌跡
    if (this.ballTrail.active) {
      this.ballTrail.update(this.physics.ballBody.position)
    }

    // 更新回放攝影機
    if (this.replayCamera.active) {
      this.replayCamera.update(delta, this.physics.ballBody.position)
    }

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
    this.ballTrail.stop()
    // 通知 GameView 物理判定結果
    if (this._onResult) this._onResult(result)
  }

  _showMessage(text, type) {
    if (this._onMessage) this._onMessage(text, type)
  }

  _hideMessage() {
    if (this._onMessage) this._onMessage('', '')
  }
}
