/**
 * Stadium.js — 精緻足球場場景
 * 專業級別：多層草皮紋理、體積光、LED 廣告板、分區觀眾席、真實球門網
 */
import * as THREE from 'three'

export const GOAL_WIDTH = 7.32
export const GOAL_HEIGHT = 2.44
export const GOAL_DEPTH = 2
export const GOAL_Z = -20
export const PENALTY_SPOT_Z = -9
export const POST_RADIUS = 0.06

export class Stadium {
  constructor(scene) {
    this.scene = scene
    this.goalParts = []
    this.animatedObjects = []

    this._createAtmosphere()
    this._createPitch()
    this._createPitchLines()
    this._createGoal()
    this._createStands()
    this._createAdBoards()
    this._createFloodLights()
    this._createCornerFlags()
    this._createDugout()
    this._createAmbientParticles()
  }

  // ─── 天空 + 大氣 ───
  _createAtmosphere() {
    // 天空漸層球
    const skyGeo = new THREE.SphereGeometry(95, 32, 24)
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x020810) },
        bottomColor: { value: new THREE.Color(0x0a2218) },
        offset: { value: 10 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
    })
    this.scene.add(new THREE.Mesh(skyGeo, skyMat))

    // 星空
    const starCount = 350
    const starGeo = new THREE.BufferGeometry()
    const starPos = new Float32Array(starCount * 3)
    const starSizes = new Float32Array(starCount)
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.35
      const r = 85
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      starPos[i * 3 + 1] = r * Math.cos(phi)
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
      starSizes[i] = 0.08 + Math.random() * 0.2
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1))
    const starMat = new THREE.PointsMaterial({
      color: 0xffeedd, size: 0.15, transparent: true, opacity: 0.7,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    })
    this.scene.add(new THREE.Points(starGeo, starMat))

    // 低空薄霧
    const fogGeo = new THREE.PlaneGeometry(120, 80)
    const fogMat = new THREE.MeshBasicMaterial({
      color: 0x1a3a2a, transparent: true, opacity: 0.08,
      side: THREE.DoubleSide, depthWrite: false,
    })
    const fog = new THREE.Mesh(fogGeo, fogMat)
    fog.rotation.x = -Math.PI / 2
    fog.position.set(0, 3, -10)
    this.scene.add(fog)
  }

  // ─── 草皮（多層紋理） ───
  _createPitch() {
    // 主草皮
    const pitchGeo = new THREE.PlaneGeometry(72, 105, 1, 1)
    const pitchMat = new THREE.MeshStandardMaterial({
      color: 0x2d8a4e, roughness: 0.82, metalness: 0,
    })
    const pitch = new THREE.Mesh(pitchGeo, pitchMat)
    pitch.rotation.x = -Math.PI / 2
    pitch.receiveShadow = true
    this.scene.add(pitch)

    // 草皮割紋條紋（交替深淺，寬度 4m）
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x246e3c, roughness: 0.88, metalness: 0,
      transparent: true, opacity: 0.35,
    })
    for (let i = -52; i < 53; i += 8) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(72, 4), darkMat)
      stripe.rotation.x = -Math.PI / 2
      stripe.position.set(0, 0.003, i)
      this.scene.add(stripe)
    }

    // 罰球點附近磨損區域
    const wearGeo = new THREE.CircleGeometry(2, 24)
    const wearMat = new THREE.MeshStandardMaterial({
      color: 0x3a7a4a, roughness: 0.95, metalness: 0,
      transparent: true, opacity: 0.3,
    })
    const wear = new THREE.Mesh(wearGeo, wearMat)
    wear.rotation.x = -Math.PI / 2
    wear.position.set(0, 0.006, PENALTY_SPOT_Z)
    this.scene.add(wear)

    // 球門區磨損
    const goalWear = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 4), wearMat
    )
    goalWear.rotation.x = -Math.PI / 2
    goalWear.position.set(0, 0.006, GOAL_Z + 1)
    this.scene.add(goalWear)

    // 場外區域（深色地面）
    const outerGeo = new THREE.PlaneGeometry(140, 140)
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0x1a3320, roughness: 0.95, metalness: 0,
    })
    const outer = new THREE.Mesh(outerGeo, outerMat)
    outer.rotation.x = -Math.PI / 2
    outer.position.set(0, -0.02, -10)
    this.scene.add(outer)
  }

  // ─── 球場線條（精細） ───
  _createPitchLines() {
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.75,
    })
    const lineW = 0.12

    const line = (x, z, w, h) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lineMat)
      m.rotation.x = -Math.PI / 2
      m.position.set(x, 0.012, z)
      this.scene.add(m)
    }

    // 邊線
    line(0, -52.5, 72, lineW)  // 底線
    line(0, 52.5, 72, lineW)   // 頂線
    line(-36, 0, lineW, 105)   // 左邊線
    line(36, 0, lineW, 105)    // 右邊線

    // 中線
    line(0, 0, 72, lineW)

    // 中圈
    const circle = new THREE.Mesh(
      new THREE.RingGeometry(9.15, 9.15 + lineW, 64),
      lineMat
    )
    circle.rotation.x = -Math.PI / 2
    circle.position.set(0, 0.012, 0)
    this.scene.add(circle)

    // 中點
    const centerDot = new THREE.Mesh(
      new THREE.CircleGeometry(0.15, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    )
    centerDot.rotation.x = -Math.PI / 2
    centerDot.position.set(0, 0.013, 0)
    this.scene.add(centerDot)

    // 罰球區
    line(0, -8, 32.32, lineW)    // 頂線
    line(0, GOAL_Z, 32.32, lineW)  // 底線（球門線）
    line(-16.16, -14, lineW, 12)
    line(16.16, -14, lineW, 12)

    // 小禁區
    line(0, -14.5, 14.64, lineW)
    line(0, GOAL_Z, 14.64, lineW)
    line(-7.32, -17.25, lineW, 5.5)
    line(7.32, -17.25, lineW, 5.5)

    // 罰球點
    const spot = new THREE.Mesh(
      new THREE.CircleGeometry(0.12, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    )
    spot.rotation.x = -Math.PI / 2
    spot.position.set(0, 0.015, PENALTY_SPOT_Z)
    this.scene.add(spot)

    // 罰球弧
    const arc = new THREE.Mesh(
      new THREE.RingGeometry(9.15, 9.15 + lineW, 32, 1, Math.PI * 0.72, Math.PI * 0.56),
      lineMat
    )
    arc.rotation.x = -Math.PI / 2
    arc.position.set(0, 0.012, -8)
    this.scene.add(arc)
  }

  // ─── 球門（精緻金屬 + 真實網格） ───
  _createGoal() {
    const postMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee, metalness: 0.9, roughness: 0.1,
      envMapIntensity: 1.5,
    })

    // 門柱（圓形截面）
    const createPost = (x, y, z, h, horiz = false) => {
      const geo = horiz
        ? new THREE.CylinderGeometry(POST_RADIUS, POST_RADIUS, GOAL_WIDTH + POST_RADIUS * 2, 16)
        : new THREE.CylinderGeometry(POST_RADIUS, POST_RADIUS, h, 16)
      const post = new THREE.Mesh(geo, postMat)
      if (horiz) post.rotation.z = Math.PI / 2
      post.position.set(x, y, z)
      post.castShadow = true
      this.scene.add(post)
      this.goalParts.push(post)
    }

    createPost(-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, GOAL_Z, GOAL_HEIGHT)
    createPost(GOAL_WIDTH / 2, GOAL_HEIGHT / 2, GOAL_Z, GOAL_HEIGHT)
    createPost(0, GOAL_HEIGHT, GOAL_Z, 0, true)

    // 後方支撐結構
    const suppMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc, metalness: 0.8, roughness: 0.2,
    })
    const suppR = POST_RADIUS * 0.6

    for (const x of [-GOAL_WIDTH / 2, GOAL_WIDTH / 2]) {
      // 頂部水平支撐
      const topSupp = new THREE.Mesh(
        new THREE.CylinderGeometry(suppR, suppR, GOAL_DEPTH, 6), suppMat
      )
      topSupp.rotation.x = Math.PI / 2
      topSupp.position.set(x, GOAL_HEIGHT, GOAL_Z - GOAL_DEPTH / 2)
      this.scene.add(topSupp)

      // 斜撐桿（從橫梁到地面後方）
      const diagLen = Math.sqrt(GOAL_DEPTH * GOAL_DEPTH + GOAL_HEIGHT * GOAL_HEIGHT)
      const diag = new THREE.Mesh(
        new THREE.CylinderGeometry(suppR * 0.8, suppR * 0.8, diagLen, 6), suppMat
      )
      const diagAngle = Math.atan2(GOAL_HEIGHT, GOAL_DEPTH)
      diag.rotation.x = diagAngle
      diag.position.set(x, GOAL_HEIGHT / 2, GOAL_Z - GOAL_DEPTH / 2)
      this.scene.add(diag)

      // 後方立柱
      const backPost = new THREE.Mesh(
        new THREE.CylinderGeometry(suppR, suppR, 0.3, 6), suppMat
      )
      backPost.position.set(x, 0.15, GOAL_Z - GOAL_DEPTH)
      this.scene.add(backPost)
    }

    // ── 球門網（密實六角網格感） ──
    const netMat = new THREE.MeshBasicMaterial({
      color: 0xcccccc, transparent: true, opacity: 0.1,
      wireframe: true, side: THREE.DoubleSide,
    })
    const netMatSolid = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.03,
      side: THREE.DoubleSide, depthWrite: false,
    })

    // 後網
    const bw = GOAL_WIDTH, bh = GOAL_HEIGHT
    const netBack = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh, 36, 12), netMat)
    netBack.position.set(0, bh / 2, GOAL_Z - GOAL_DEPTH)
    this.scene.add(netBack)
    // 半透明底層
    const netBackSolid = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), netMatSolid)
    netBackSolid.position.copy(netBack.position)
    this.scene.add(netBackSolid)

    // 頂網
    const netTop = new THREE.Mesh(new THREE.PlaneGeometry(bw, GOAL_DEPTH, 36, 8), netMat)
    netTop.rotation.x = Math.PI / 2
    netTop.position.set(0, GOAL_HEIGHT, GOAL_Z - GOAL_DEPTH / 2)
    this.scene.add(netTop)

    // 側網
    for (const x of [-bw / 2, bw / 2]) {
      const side = new THREE.Mesh(
        new THREE.PlaneGeometry(GOAL_DEPTH, bh, 8, 12), netMat
      )
      side.rotation.y = Math.PI / 2
      side.position.set(x, bh / 2, GOAL_Z - GOAL_DEPTH / 2)
      this.scene.add(side)
    }

    // 斜面網（橫梁到地面後方）
    const slopeH = Math.sqrt(GOAL_DEPTH * GOAL_DEPTH + GOAL_HEIGHT * GOAL_HEIGHT)
    const slopeNet = new THREE.Mesh(
      new THREE.PlaneGeometry(bw, slopeH, 36, 10), netMat
    )
    const ang = -Math.atan2(GOAL_HEIGHT, GOAL_DEPTH)
    slopeNet.rotation.x = ang + Math.PI / 2
    slopeNet.position.set(0, GOAL_HEIGHT / 2, GOAL_Z - GOAL_DEPTH / 2)
    this.scene.add(slopeNet)
  }

  // ─── 觀眾看台（分區、有頂棚） ───
  _createStands() {
    this._createStandSection(0, -38, 60, 0, 5, 0x1a1a2e)
    this._createStandSection(-35, -10, 50, Math.PI / 2, 4, 0x1a1a2e)
    this._createStandSection(35, -10, 50, -Math.PI / 2, 4, 0x1a1a2e)
  }

  _createStandSection(x, z, width, rotY, tiers) {
    const group = new THREE.Group()
    group.position.set(x, 0, z)
    group.rotation.y = rotY

    const seatColors = [
      0xe24b4a, 0xf5c842, 0x00b8d4, 0xff6b35,
      0x9b59b6, 0xffffff, 0x3498db, 0x2ecc71,
      0xff69b4, 0xffa07a, 0x87ceeb, 0xdaa520,
    ]

    for (let t = 0; t < tiers; t++) {
      // 階梯混凝土
      const tierH = 1.8
      const tierD = 2.5
      const tierGeo = new THREE.BoxGeometry(width, tierH, tierD)
      const shade = (t % 2 === 0) ? 0x1a1a2e : 0x161628
      const tierMat = new THREE.MeshStandardMaterial({ color: shade, roughness: 0.92, metalness: 0.05 })
      const tier = new THREE.Mesh(tierGeo, tierMat)
      tier.position.set(0, tierH / 2 + t * (tierH + 0.1), -t * tierD)
      tier.receiveShadow = true
      group.add(tier)

      // 座位（小方塊排列）
      const seatRows = 2
      const seatsPerRow = Math.floor(width / 0.5)
      for (let row = 0; row < seatRows; row++) {
        for (let s = 0; s < seatsPerRow; s++) {
          if (Math.random() < 0.15) continue // 空位
          const seatGeo = new THREE.BoxGeometry(0.35, 0.35, 0.3)
          const sColor = seatColors[Math.floor(Math.random() * seatColors.length)]
          const seatMat = new THREE.MeshStandardMaterial({
            color: sColor, roughness: 0.7, metalness: 0.1,
          })
          const seat = new THREE.Mesh(seatGeo, seatMat)
          seat.position.set(
            -width / 2 + 0.5 + s * 0.5,
            tierH + t * (tierH + 0.1) + 0.1 + row * 0.4,
            -t * tierD + (row - 0.5) * 0.6
          )
          group.add(seat)

          // 觀眾人形（部分座位有人）
          if (Math.random() < 0.7) {
            const personGeo = new THREE.CapsuleGeometry(0.06, 0.18, 2, 4)
            const personMat = new THREE.MeshStandardMaterial({
              color: seatColors[Math.floor(Math.random() * seatColors.length)],
              roughness: 0.8,
            })
            const person = new THREE.Mesh(personGeo, personMat)
            person.position.set(
              seat.position.x + (Math.random() - 0.5) * 0.1,
              seat.position.y + 0.35 + Math.random() * 0.15,
              seat.position.z
            )
            person.scale.y = 0.7 + Math.random() * 0.5
            group.add(person)
          }
        }
      }
    }

    // 頂棚
    const roofGeo = new THREE.BoxGeometry(width + 4, 0.3, tiers * 2.8 + 3)
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x222233, roughness: 0.6, metalness: 0.4,
    })
    const roof = new THREE.Mesh(roofGeo, roofMat)
    roof.position.set(0, tiers * 2 + 3, -tiers * 1.3)
    roof.castShadow = true
    group.add(roof)

    // 頂棚底部燈光
    const roofLight = new THREE.Mesh(
      new THREE.PlaneGeometry(width - 2, tiers * 2),
      new THREE.MeshBasicMaterial({
        color: 0x334433, transparent: true, opacity: 0.06,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
      })
    )
    roofLight.rotation.x = Math.PI / 2
    roofLight.position.set(0, tiers * 2 + 2.8, -tiers * 1.3)
    group.add(roofLight)

    this.scene.add(group)
  }

  // ─── LED 廣告板（發光） ───
  _createAdBoards() {
    const boardH = 0.9
    const boardD = 0.06

    const createLEDBoard = (x, z, w, rotY, color) => {
      // 板體
      const geo = new THREE.BoxGeometry(w, boardH, boardD)
      const mat = new THREE.MeshStandardMaterial({
        color: 0x111111, roughness: 0.3, metalness: 0.6,
      })
      const board = new THREE.Mesh(geo, mat)
      board.position.set(x, boardH / 2, z)
      board.rotation.y = rotY
      this.scene.add(board)

      // LED 發光面
      const ledGeo = new THREE.PlaneGeometry(w - 0.1, boardH - 0.1)
      const ledMat = new THREE.MeshBasicMaterial({
        color: color, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
      const led = new THREE.Mesh(ledGeo, ledMat)
      led.position.set(x, boardH / 2, z + boardD / 2 + 0.01)
      led.rotation.y = rotY
      this.scene.add(led)

      // 地面反光
      const reflGeo = new THREE.PlaneGeometry(w, 1.5)
      const reflMat = new THREE.MeshBasicMaterial({
        color: color, transparent: true, opacity: 0.04,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
      const refl = new THREE.Mesh(reflGeo, reflMat)
      refl.rotation.x = -Math.PI / 2
      refl.position.set(x, 0.015, z + 1)
      refl.rotation.z = rotY
      this.scene.add(refl)
    }

    // 球門後方
    const colors = [0x00875a, 0x1a5276, 0x00875a, 0xcc6600, 0x00875a, 0x1a5276]
    for (let i = 0; i < 6; i++) {
      createLEDBoard(-22 + i * 8.5, -30, 8, 0, colors[i])
    }

    // 兩側
    for (let i = 0; i < 4; i++) {
      createLEDBoard(-26, -22 + i * 8, 7.5, Math.PI / 2, colors[i % colors.length])
      createLEDBoard(26, -22 + i * 8, 7.5, -Math.PI / 2, colors[(i + 2) % colors.length])
    }
  }

  // ─── 泛光燈塔 ───
  _createFloodLights() {
    const positions = [
      [-28, -32], [28, -32], [-28, 12], [28, 12],
    ]

    positions.forEach(([x, z]) => {
      // 燈塔桿
      const poleGeo = new THREE.CylinderGeometry(0.2, 0.35, 22, 8)
      const poleMat = new THREE.MeshStandardMaterial({
        color: 0x555555, metalness: 0.85, roughness: 0.2,
      })
      const pole = new THREE.Mesh(poleGeo, poleMat)
      pole.position.set(x, 11, z)
      pole.castShadow = true
      this.scene.add(pole)

      // 燈具平台
      const platGeo = new THREE.BoxGeometry(3, 0.3, 2)
      const plat = new THREE.Mesh(platGeo, poleMat)
      plat.position.set(x, 22, z)
      this.scene.add(plat)

      // 燈具（3x2 矩陣）
      for (let lx = -1; lx <= 1; lx++) {
        for (let lz = -0.5; lz <= 0.5; lz++) {
          const lampGeo = new THREE.BoxGeometry(0.6, 0.15, 0.4)
          const lampMat = new THREE.MeshBasicMaterial({
            color: 0xfff5e6, transparent: true, opacity: 0.9,
          })
          const lamp = new THREE.Mesh(lampGeo, lampMat)
          lamp.position.set(x + lx * 0.8, 22.3, z + lz * 0.7)
          this.scene.add(lamp)
        }
      }

      // 燈光光錐（體積光效果）
      const coneGeo = new THREE.CylinderGeometry(0.5, 8, 22, 8, 1, true)
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0xfff5e0, transparent: true, opacity: 0.015,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
      })
      const cone = new THREE.Mesh(coneGeo, coneMat)
      cone.position.set(x, 11, z)
      // 傾斜指向球場中心
      const angle = Math.atan2(z + 10, 22)
      cone.rotation.x = angle * 0.3
      this.scene.add(cone)
    })
  }

  // ─── 角旗 ───
  _createCornerFlags() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.6, roughness: 0.3 })
    const flagMat = new THREE.MeshBasicMaterial({ color: 0xff3333, side: THREE.DoubleSide })

    const corners = [[-16.16, GOAL_Z], [16.16, GOAL_Z]]

    corners.forEach(([x, z]) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.02, 1.6, 6), poleMat
      )
      pole.position.set(x, 0.8, z)
      this.scene.add(pole)

      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.18), flagMat)
      flag.position.set(x + 0.14, 1.55, z)
      this.scene.add(flag)
    })
  }

  // ─── 替補席 ───
  _createDugout() {
    for (const side of [-1, 1]) {
      const x = side * 26
      // 遮棚
      const roofGeo = new THREE.BoxGeometry(8, 0.15, 2.5)
      const roofMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e, roughness: 0.5, metalness: 0.3,
        transparent: true, opacity: 0.8,
      })
      const roof = new THREE.Mesh(roofGeo, roofMat)
      roof.position.set(x, 2.2, 2)
      roof.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2
      this.scene.add(roof)

      // 座椅
      for (let i = 0; i < 6; i++) {
        const seatGeo = new THREE.BoxGeometry(0.4, 0.5, 0.4)
        const seatMat = new THREE.MeshStandardMaterial({
          color: side > 0 ? 0x2266aa : 0xaa2222, roughness: 0.6,
        })
        const seat = new THREE.Mesh(seatGeo, seatMat)
        const sz = -1 + i * 0.7
        seat.position.set(x, 0.25, sz)
        this.scene.add(seat)
      }
    }
  }

  // ─── 氛圍漂浮粒子 ───
  _createAmbientParticles() {
    const count = 150
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 70
      pos[i * 3 + 1] = 1 + Math.random() * 18
      pos[i * 3 + 2] = -45 + Math.random() * 60
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const mat = new THREE.PointsMaterial({
      color: 0xffeedd, size: 0.06, transparent: true, opacity: 0.25,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    })
    this.scene.add(new THREE.Points(geo, mat))
  }
}
