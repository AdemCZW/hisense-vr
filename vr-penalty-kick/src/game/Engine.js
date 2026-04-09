/**
 * Engine.js — Three.js 核心引擎
 * 負責 scene, camera, renderer, lighting, resize, animation loop
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export class Engine {
  constructor(container) {
    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a3a2a)
    this.scene.fog = new THREE.FogExp2(0x1a3a2a, 0.012)

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    )
    this.camera.position.set(0, 1.5, 20)

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    this.renderer.xr.enabled = true

    container.appendChild(this.renderer.domElement)

    // Clock
    this.clock = new THREE.Clock()

    // Desktop controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, 1, 0)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.maxPolarAngle = Math.PI * 0.55
    this.controls.minDistance = 8
    this.controls.maxDistance = 30

    // Lighting
    this._setupLights()

    // Resize
    this._onResize = this._onResize.bind(this)
    window.addEventListener('resize', this._onResize)

    // Update callbacks
    this._updateCallbacks = []
  }

  _setupLights() {
    // Hemisphere ambient
    const ambient = new THREE.HemisphereLight(0x87ceeb, 0x2d5a27, 0.6)
    this.scene.add(ambient)

    // Sun
    const sun = new THREE.DirectionalLight(0xfff5e6, 1.8)
    sun.position.set(30, 40, 20)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 100
    sun.shadow.camera.left = -30
    sun.shadow.camera.right = 30
    sun.shadow.camera.top = 30
    sun.shadow.camera.bottom = -30
    sun.shadow.bias = -0.001
    this.scene.add(sun)

    // Fill light
    const fill = new THREE.DirectionalLight(0xc4e0ff, 0.3)
    fill.position.set(-20, 10, -10)
    this.scene.add(fill)

    // Stadium spot lights
    this._createStadiumLight(-25, -15)
    this._createStadiumLight(25, -15)
    this._createStadiumLight(-25, 25)
    this._createStadiumLight(25, 25)
  }

  _createStadiumLight(x, z) {
    const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 18, 8)
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.8,
      roughness: 0.3,
    })
    const pole = new THREE.Mesh(poleGeo, poleMat)
    pole.position.set(x, 9, z)
    pole.castShadow = true
    this.scene.add(pole)

    const spot = new THREE.SpotLight(0xfff5e6, 30, 60, Math.PI * 0.3, 0.5, 1)
    spot.position.set(x, 18, z)
    spot.target.position.set(0, 0, 0)
    spot.castShadow = false
    this.scene.add(spot)
    this.scene.add(spot.target)
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  /** Register an update callback: fn(delta, elapsedTime) */
  onUpdate(fn) {
    this._updateCallbacks.push(fn)
  }

  /** Remove an update callback */
  offUpdate(fn) {
    this._updateCallbacks = this._updateCallbacks.filter((cb) => cb !== fn)
  }

  /** Start the render loop */
  start() {
    this.renderer.setAnimationLoop(() => {
      const delta = Math.min(this.clock.getDelta(), 0.05)
      const elapsed = this.clock.elapsedTime

      for (const cb of this._updateCallbacks) {
        cb(delta, elapsed)
      }

      this.controls.update()
      this.renderer.render(this.scene, this.camera)
    })
  }

  /** Stop the render loop */
  stop() {
    this.renderer.setAnimationLoop(null)
  }

  dispose() {
    window.removeEventListener('resize', this._onResize)
    this.renderer.dispose()
    this.controls.dispose()
  }
}
