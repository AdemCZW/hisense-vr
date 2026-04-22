/**
 * PhysicsWorld.js — Cannon-es 物理引擎
 * 管理物理世界、地面、球門碰撞體、足球剛體
 */
import * as CANNON from 'cannon-es'
import { GOAL_WIDTH, GOAL_HEIGHT, GOAL_DEPTH, GOAL_Z } from '../scene/Stadium.js'

export class PhysicsWorld {
  constructor() {
    // 物理世界
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    })
    this.world.broadphase = new CANNON.SAPBroadphase(this.world)
    this.world.allowSleep = true

    // 材質
    this.groundMaterial = new CANNON.Material('ground')
    this.ballMaterial = new CANNON.Material('ball')
    this.postMaterial = new CANNON.Material('post')

    // 接觸材質
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.ballMaterial, this.groundMaterial, {
        friction: 0.4,
        restitution: 0.5,
      })
    )
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.ballMaterial, this.postMaterial, {
        friction: 0.2,
        restitution: 0.6,
      })
    )

    // 地面
    this.groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane(),
      material: this.groundMaterial,
    })
    this.groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    this.world.addBody(this.groundBody)

    // 球門碰撞體
    this._createGoalColliders()

    // 足球
    this.ballBody = this._createBallBody()
  }

  _createGoalColliders() {
    const halfW = GOAL_WIDTH / 2
    const postR = 0.06

    // Left post
    const leftPost = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Cylinder(postR, postR, GOAL_HEIGHT, 8),
      material: this.postMaterial,
    })
    leftPost.position.set(-halfW, GOAL_HEIGHT / 2, GOAL_Z)
    this.world.addBody(leftPost)

    // Right post
    const rightPost = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Cylinder(postR, postR, GOAL_HEIGHT, 8),
      material: this.postMaterial,
    })
    rightPost.position.set(halfW, GOAL_HEIGHT / 2, GOAL_Z)
    this.world.addBody(rightPost)

    // Crossbar
    const crossbar = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Cylinder(postR, postR, GOAL_WIDTH, 8),
      material: this.postMaterial,
    })
    crossbar.position.set(0, GOAL_HEIGHT, GOAL_Z)
    crossbar.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI / 2)
    this.world.addBody(crossbar)

    // Back net (invisible wall)
    const backWall = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Box(new CANNON.Vec3(halfW, GOAL_HEIGHT / 2, 0.05)),
      material: this.postMaterial,
    })
    backWall.position.set(0, GOAL_HEIGHT / 2, GOAL_Z - GOAL_DEPTH)
    this.world.addBody(backWall)
  }

  _createBallBody() {
    const body = new CANNON.Body({
      mass: 0.43, // FIFA 標準足球質量 (kg)
      shape: new CANNON.Sphere(0.22),
      material: this.ballMaterial,
      linearDamping: 0.05,
      angularDamping: 0.2,
    })
    body.position.set(0, 0.22, -9)
    this.world.addBody(body)
    return body
  }

  /**
   * 踢球 — 施加衝量
   * @param {Object} params
   * @param {number} params.targetX - 目標 X 座標
   * @param {number} params.targetY - 目標 Y 座標
   * @param {number} params.speed - 球速 m/s (預設 18-26)
   */
  kickBall({ targetX, targetY, speed }) {
    const bx = this.ballBody.position.x
    const by = this.ballBody.position.y
    const bz = this.ballBody.position.z

    const tY = targetY || 1.2
    const goalDist = Math.abs((GOAL_Z + 0.5) - bz) // ~11m

    // 計算拋物線（大弧度，球先飛高再落入球門）
    const horizontalSpeed = speed * 0.55
    const flightTime = goalDist / horizontalSpeed

    // 垂直速度：大弧線
    const gravity = 9.82
    const arcExtra = 3.0 + Math.random() * 2.0
    const vy = ((tY - by) + 0.5 * gravity * flightTime * flightTime + arcExtra) / flightTime

    // 水平方向
    const dx = targetX - bx
    const dz = (GOAL_Z + 0.5) - bz
    const hDist = Math.sqrt(dx * dx + dz * dz)
    const vx = (dx / hDist) * horizontalSpeed
    const vz = (dz / hDist) * horizontalSpeed

    // 施加衝量
    const impulse = new CANNON.Vec3(
      vx * this.ballBody.mass,
      vy * this.ballBody.mass,
      vz * this.ballBody.mass
    )
    this.ballBody.applyImpulse(impulse)

    // 旋轉（側旋 + 上旋）
    this.ballBody.angularVelocity.set(
      -8 + Math.random() * 4,             // 上旋
      (targetX > 0 ? -1 : 1) * (3 + Math.random() * 4),  // 側旋（跟方向有關）
      -10
    )

    this.ballBody.wakeUp()
  }

  /** 重置足球位置 */
  resetBall() {
    this.ballBody.position.set(0, 0.22, -14)
    this.ballBody.velocity.setZero()
    this.ballBody.angularVelocity.setZero()
    this.ballBody.quaternion.set(0, 0, 0, 1)
    this.ballBody.sleepState = CANNON.Body.AWAKE
  }

  /** 取得球速 (m/s) */
  getBallSpeed() {
    return this.ballBody.velocity.length()
  }

  /** 每幀更新 */
  update(delta) {
    this.world.step(1 / 60, delta, 3)
  }
}
