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
    this.groundBody.quaternion.setFromEulerXYZ(-Math.PI / 2, 0, 0)
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
    crossbar.quaternion.setFromEulerXYZ(0, 0, Math.PI / 2)
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

    const dx = targetX - bx
    const dy = (targetY || 1.2) - by
    const dz = (GOAL_Z + 0.5) - bz
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

    // 方向向量
    const dir = new CANNON.Vec3(dx, dy, dz)
    dir.normalize()

    // 施加衝量 (mass * velocity)
    const impulse = dir.scale(speed * this.ballBody.mass)
    this.ballBody.applyImpulse(impulse)

    // 加上旋轉
    this.ballBody.angularVelocity.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 5,
      -15
    )

    // 喚醒剛體
    this.ballBody.wakeUp()
  }

  /** 重置足球位置 */
  resetBall() {
    this.ballBody.position.set(0, 0.22, -9)
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
