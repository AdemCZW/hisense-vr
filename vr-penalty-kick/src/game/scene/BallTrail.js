/**
 * BallTrail.js — 球飛行激光軌跡（終極精緻版）
 * 支援多色主題：綠色、藍色、紅色
 * 多層漸變管道 + 動態寬度 + 能量環 + 拖尾粒子雨
 */
import * as THREE from 'three'

const MAX_POINTS = 250

// 顏色主題預設
const COLOR_THEMES = {
  green: {
    tubes: [0x003322, 0x00aa66, 0x00e5a0, 0x00ffbb, 0xeeffff],
    head: [
      { r: 0.05, color: 0xffffff, opacity: 1.0 },
      { r: 0.10, color: 0xeeffff, opacity: 0.9 },
      { r: 0.18, color: 0x88ffcc, opacity: 0.6 },
      { r: 0.30, color: 0x00ffaa, opacity: 0.35 },
      { r: 0.50, color: 0x00e5a0, opacity: 0.15 },
      { r: 0.80, color: 0x00aa66, opacity: 0.06 },
      { r: 1.20, color: 0x005533, opacity: 0.02 },
    ],
    ring: 0x00ffaa,
    sparkColors: [0.5, 0.95, 0.7],  // RGB 基底
    flameColor: [0.2, 1.0, 0.6],
  },
  blue: {
    tubes: [0x001133, 0x2266cc, 0x44aaff, 0x88ccff, 0xeeffff],
    head: [
      { r: 0.05, color: 0xffffff, opacity: 1.0 },
      { r: 0.10, color: 0xeeeeff, opacity: 0.9 },
      { r: 0.18, color: 0x88bbff, opacity: 0.6 },
      { r: 0.30, color: 0x4499ff, opacity: 0.35 },
      { r: 0.50, color: 0x2266cc, opacity: 0.15 },
      { r: 0.80, color: 0x1144aa, opacity: 0.06 },
      { r: 1.20, color: 0x002255, opacity: 0.02 },
    ],
    ring: 0x44aaff,
    sparkColors: [0.5, 0.7, 1.0],
    flameColor: [0.2, 0.5, 1.0],
  },
  red: {
    tubes: [0x330011, 0xcc3322, 0xff6644, 0xffaa88, 0xffeedd],
    head: [
      { r: 0.05, color: 0xffffff, opacity: 1.0 },
      { r: 0.10, color: 0xffeeee, opacity: 0.9 },
      { r: 0.18, color: 0xff8866, opacity: 0.6 },
      { r: 0.30, color: 0xff4422, opacity: 0.35 },
      { r: 0.50, color: 0xcc3322, opacity: 0.15 },
      { r: 0.80, color: 0x881111, opacity: 0.06 },
      { r: 1.20, color: 0x440000, opacity: 0.02 },
    ],
    ring: 0xff6644,
    sparkColors: [1.0, 0.6, 0.3],
    flameColor: [1.0, 0.3, 0.1],
  },
}

export class BallTrail {
  constructor(scene, theme = 'green') {
    this.scene = scene
    this.active = false
    this.points = []
    this.theme = COLOR_THEMES[theme] || COLOR_THEMES.green

    // 容器
    this.container = new THREE.Group()
    this.container.visible = false
    scene.add(this.container)

    this._initMaterials()
    this._initHead()
    this._initRings()
    this._initParticles()

    this._frame = 0
    this._prevPos = new THREE.Vector3()
    this._velocity = new THREE.Vector3()
  }

  /** 切換顏色主題 */
  setTheme(themeName) {
    const t = COLOR_THEMES[themeName]
    if (!t) return
    this.theme = t

    // 更新管道材質顏色
    this.tubeMats.forEach((m, i) => m.color.setHex(t.tubes[i]))

    // 更新球頭光暈顏色
    this.headMeshes.forEach((m, i) => {
      m.material.color.setHex(t.head[i].color)
    })

    // 更新能量環顏色
    this.ringMat.color.setHex(t.ring)
  }

  _initMaterials() {
    const t = this.theme
    this.tubeMats = [
      this._mat(t.tubes[0], 0.05, true),
      this._mat(t.tubes[1], 0.1, true),
      this._mat(t.tubes[2], 0.25, true),
      this._mat(t.tubes[3], 0.6),
      this._mat(t.tubes[4], 0.95),
    ]
    this.tubeRadii = [0.4, 0.22, 0.12, 0.055, 0.018]
    this.tubes = []
  }

  _mat(color, opacity, doubleSide) {
    return new THREE.MeshBasicMaterial({
      color, transparent: true, opacity,
      side: doubleSide ? THREE.DoubleSide : THREE.FrontSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  }

  _initHead() {
    this.headGroup = new THREE.Group()
    this.headGroup.visible = false
    this.scene.add(this.headGroup)

    this.headMeshes = this.theme.head.map(l => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(l.r, 16, 16),
        new THREE.MeshBasicMaterial({
          color: l.color, transparent: true, opacity: l.opacity,
          blending: THREE.AdditiveBlending, depthWrite: false,
        })
      )
      this.headGroup.add(mesh)
      return mesh
    })
  }

  _initRings() {
    this.rings = []
    this.ringGeo = new THREE.RingGeometry(0.15, 0.25, 24)
    this.ringMat = new THREE.MeshBasicMaterial({
      color: this.theme.ring, transparent: true, opacity: 0.4,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
    })
  }

  _initParticles() {
    // 火花粒子
    const sparkCount = 120
    const sparkGeo = new THREE.BufferGeometry()
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sparkCount * 3), 3))
    sparkGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(sparkCount * 3), 3))
    sparkGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(sparkCount), 1))

    this.sparkMat = new THREE.PointsMaterial({
      size: 0.05, transparent: true, opacity: 0.9,
      vertexColors: true, sizeAttenuation: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    this.sparks = new THREE.Points(sparkGeo, this.sparkMat)
    this.sparks.frustumCulled = false
    this.sparks.visible = false
    this.scene.add(this.sparks)

    // 尾焰粒子
    const flameCount = 40
    const flameGeo = new THREE.BufferGeometry()
    flameGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(flameCount * 3), 3))
    flameGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(flameCount * 3), 3))

    this.flameMat = new THREE.PointsMaterial({
      size: 0.18, transparent: true, opacity: 0.3,
      vertexColors: true, sizeAttenuation: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    this.flames = new THREE.Points(flameGeo, this.flameMat)
    this.flames.frustumCulled = false
    this.flames.visible = false
    this.scene.add(this.flames)

    this.sparkCount = sparkCount
    this.flameCount = flameCount
    this.sparkVel = Array.from({ length: sparkCount }, () => new THREE.Vector3())
    this.sparkLife = new Float32Array(sparkCount)
    this.flameVel = Array.from({ length: flameCount }, () => new THREE.Vector3())
    this.flameLife = new Float32Array(flameCount)
  }

  start() {
    this.active = true
    this.points = []
    this._frame = 0
    this._removeTubes()
    this._removeRings()
    this.container.visible = true
    this.headGroup.visible = true
    this.sparks.visible = true
    this.flames.visible = true
    for (let i = 0; i < this.sparkCount; i++) this.sparkLife[i] = 0
    for (let i = 0; i < this.flameCount; i++) this.flameLife[i] = 0
    this._prevPos.set(0, 0, 0)
  }

  update(ballPosition) {
    if (!this.active) return
    if (this.points.length >= MAX_POINTS) return

    this._frame++
    const pos = new THREE.Vector3(ballPosition.x, ballPosition.y, ballPosition.z)

    if (this._frame > 1) {
      this._velocity.subVectors(pos, this._prevPos)
    }
    this._prevPos.copy(pos)

    // 頭部光暈 + 脈動
    this.headGroup.position.copy(pos)
    const pulse = 1 + Math.sin(this._frame * 0.5) * 0.1
    const fastPulse = 1 + Math.sin(this._frame * 1.5) * 0.05
    this.headMeshes.forEach((m, i) => {
      m.scale.setScalar(i < 3 ? fastPulse : pulse + i * 0.01)
    })

    this._updateSparks(pos)
    this._updateFlames(pos)
    this._updateRings()

    if (this._frame % 2 !== 0) return
    this.points.push(pos)

    if (this.points.length % 8 === 0 && this._velocity.length() > 0.01) {
      this._spawnRing(pos)
    }

    if (this.points.length >= 2) {
      this._buildTubes()
    }
  }

  _buildTubes() {
    this._removeTubes()
    const curve = new THREE.CatmullRomCurve3(this.points)
    const segs = Math.min(this.points.length * 3, 400)

    this.tubeRadii.forEach((r, i) => {
      const geo = new THREE.TubeGeometry(curve, segs, r, 8, false)
      const mesh = new THREE.Mesh(geo, this.tubeMats[i])
      mesh.frustumCulled = false
      this.container.add(mesh)
      this.tubes.push(mesh)
    })
  }

  _spawnRing(pos) {
    const ring = new THREE.Mesh(this.ringGeo.clone(), this.ringMat.clone())
    ring.position.copy(pos)
    if (this._velocity.length() > 0.001) {
      ring.lookAt(pos.clone().add(this._velocity.clone().normalize()))
    }
    ring.scale.setScalar(0.5)
    ring.userData = { age: 0, maxAge: 40 }
    this.scene.add(ring)
    this.rings.push(ring)
  }

  _updateRings() {
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i]
      ring.userData.age++
      const t = ring.userData.age / ring.userData.maxAge
      ring.scale.setScalar(0.5 + t * 2.5)
      ring.material.opacity = 0.4 * (1 - t)
      if (t >= 1) {
        this.scene.remove(ring)
        ring.geometry.dispose()
        ring.material.dispose()
        this.rings.splice(i, 1)
      }
    }
  }

  _updateSparks(ballPos) {
    const posArr = this.sparks.geometry.attributes.position.array
    const colArr = this.sparks.geometry.attributes.color.array
    const sizeArr = this.sparks.geometry.attributes.size.array
    const sc = this.theme.sparkColors

    for (let i = 0; i < this.sparkCount; i++) {
      const i3 = i * 3
      if (this.sparkLife[i] <= 0) {
        if (Math.random() < 0.4) {
          this.sparkLife[i] = 1.0
          posArr[i3] = ballPos.x + (Math.random() - 0.5) * 0.1
          posArr[i3 + 1] = ballPos.y + (Math.random() - 0.5) * 0.1
          posArr[i3 + 2] = ballPos.z + (Math.random() - 0.5) * 0.1
          const spread = 1.5 + Math.random() * 2
          this.sparkVel[i].set(
            (Math.random() - 0.5) * spread - this._velocity.x * 2,
            (Math.random() - 0.5) * spread + 0.5,
            (Math.random() - 0.5) * spread - this._velocity.z * 2
          )
          const r = Math.random() * 0.3
          colArr[i3] = sc[0] + r
          colArr[i3 + 1] = sc[1] + r * 0.5
          colArr[i3 + 2] = sc[2] + r
          sizeArr[i] = 0.03 + Math.random() * 0.06
        }
      } else {
        this.sparkLife[i] -= 0.02
        const v = this.sparkVel[i]
        posArr[i3] += v.x * 0.012
        posArr[i3 + 1] += v.y * 0.012 - 0.002
        posArr[i3 + 2] += v.z * 0.012
        v.multiplyScalar(0.94)
        sizeArr[i] *= 0.98
      }
    }
    this.sparks.geometry.attributes.position.needsUpdate = true
    this.sparks.geometry.attributes.color.needsUpdate = true
    this.sparks.geometry.attributes.size.needsUpdate = true
  }

  _updateFlames(ballPos) {
    const posArr = this.flames.geometry.attributes.position.array
    const colArr = this.flames.geometry.attributes.color.array
    const fc = this.theme.flameColor

    for (let i = 0; i < this.flameCount; i++) {
      const i3 = i * 3
      if (this.flameLife[i] <= 0) {
        if (Math.random() < 0.25) {
          this.flameLife[i] = 1.0
          posArr[i3] = ballPos.x
          posArr[i3 + 1] = ballPos.y
          posArr[i3 + 2] = ballPos.z
          this.flameVel[i].set(
            (Math.random() - 0.5) * 0.8 - this._velocity.x * 1.5,
            (Math.random() - 0.3) * 0.6,
            (Math.random() - 0.5) * 0.8 - this._velocity.z * 1.5
          )
          colArr[i3] = fc[0]
          colArr[i3 + 1] = fc[1]
          colArr[i3 + 2] = fc[2]
        }
      } else {
        this.flameLife[i] -= 0.015
        const v = this.flameVel[i]
        posArr[i3] += v.x * 0.015
        posArr[i3 + 1] += v.y * 0.015
        posArr[i3 + 2] += v.z * 0.015
        v.multiplyScalar(0.92)
        const life = this.flameLife[i]
        colArr[i3] = fc[0] * life + 0.3 * (1 - life)
        colArr[i3 + 1] = fc[1] * life + 0.3 * (1 - life)
        colArr[i3 + 2] = fc[2] * life + 0.3 * (1 - life)
      }
    }
    this.flames.geometry.attributes.position.needsUpdate = true
    this.flames.geometry.attributes.color.needsUpdate = true
  }

  _removeTubes() {
    this.tubes.forEach(t => { this.container.remove(t); t.geometry.dispose() })
    this.tubes = []
  }

  _removeRings() {
    this.rings.forEach(r => { this.scene.remove(r); r.geometry.dispose(); r.material.dispose() })
    this.rings = []
  }

  stop() {
    this.active = false
    this.headGroup.visible = false
  }

  fadeOut(duration = 1500) {
    this.stop()
    const startTime = performance.now()
    const initTube = this.tubeMats.map(m => m.opacity)

    const fade = () => {
      const t = Math.min((performance.now() - startTime) / duration, 1)
      const ease = 1 - t * t
      this.tubeMats.forEach((m, i) => { m.opacity = initTube[i] * ease })
      this.sparkMat.opacity = 0.9 * ease
      this.flameMat.opacity = 0.3 * ease
      this._updateRings()
      if (t < 1) {
        requestAnimationFrame(fade)
      } else {
        this._cleanup()
        this.tubeMats.forEach((m, i) => { m.opacity = initTube[i] })
        this.sparkMat.opacity = 0.9
        this.flameMat.opacity = 0.3
      }
    }
    requestAnimationFrame(fade)
  }

  reset() {
    this.active = false
    this.points = []
    this._cleanup()
  }

  _cleanup() {
    this._removeTubes()
    this._removeRings()
    this.container.visible = false
    this.headGroup.visible = false
    this.sparks.visible = false
    this.flames.visible = false
  }

  dispose(scene) {
    this._cleanup()
    scene.remove(this.container)
    scene.remove(this.headGroup)
    scene.remove(this.sparks)
    scene.remove(this.flames)
    this.tubeMats.forEach(m => m.dispose())
    this.headMeshes.forEach(m => { m.geometry.dispose(); m.material.dispose() })
    this.sparks.geometry.dispose()
    this.sparkMat.dispose()
    this.flames.geometry.dispose()
    this.flameMat.dispose()
    this.ringGeo.dispose()
    this.ringMat.dispose()
  }
}
