<template>
  <div id="app">
    <!-- 持久 3D 球場背景 -->
    <div ref="sceneContainer" class="scene-bg"></div>
    <!-- 漸層濾鏡 — 蓋在 3D 場景上方 -->
    <div class="gradient-filter" :class="{ hidden: store.screen !== 'start' }"></div>

    <!-- DEV 導航列 — 快速跳頁 -->
    <div v-if="isDev" class="dev-nav">
      <button
        v-for="s in screens" :key="s.id"
        class="dev-nav-btn"
        :class="{ active: store.screen === s.id }"
        @click="devGo(s.id)"
      >{{ s.label }}</button>
      <span class="dev-nav-arrows">
        <button class="dev-nav-arrow" @click="devPrev" title="上一頁">&#9664;</button>
        <button class="dev-nav-arrow" @click="devNext" title="下一頁">&#9654;</button>
      </span>
    </div>

    <!-- UI 覆蓋層 — 交叉淡入淡出（不加 mode，新舊同時存在短暫重疊） -->
    <Transition name="fade">
      <StartScreen
        v-if="store.screen === 'start'"
        key="start"
        @start="store.setScreen('tutorial')"
      />
      <TutorialScreen
        v-else-if="store.screen === 'tutorial'"
        key="tutorial"
        @complete="store.setScreen('calibView')"
      />
      <CalibrationView
        v-else-if="store.screen === 'calibView'"
        key="calibView"
        @complete="store.setScreen('calibKick')"
      />
      <CalibrationKick
        v-else-if="store.screen === 'calibKick'"
        key="calibKick"
        @complete="store.setScreen('warmUp')"
      />
      <WarmUpView
        v-else-if="store.screen === 'warmUp'"
        key="warmUp"
        @complete="store.setScreen('warmUpDodge')"
      />
      <WarmUpDodge
        v-else-if="store.screen === 'warmUpDodge'"
        key="warmUpDodge"
        @complete="store.startGame()"
      />
      <GameView
        v-else-if="store.screen === 'game'"
        key="game"
      />
      <ResultScreen
        v-else-if="store.screen === 'result'"
        key="result"
      />
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, provide, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { useGameStore } from './stores/gameStore.js'
import { Stadium } from './game/scene/Stadium.js'
import { XRManager } from './game/xr/XRManager.js'

import StartScreen from './views/StartScreen.vue'
import TutorialScreen from './views/TutorialScreen.vue'
import CalibrationView from './views/CalibrationView.vue'
import CalibrationKick from './views/CalibrationKick.vue'
import WarmUpView from './views/WarmUpView.vue'
import WarmUpDodge from './views/WarmUpDodge.vue'
import GameView from './views/GameView.vue'
import ResultScreen from './views/ResultScreen.vue'

const store = useGameStore()
const sceneContainer = ref(null)

// ─── DEV 導航 ───
const isDev = import.meta.env.DEV
const screens = [
  { id: 'start', label: 'Start' },
  { id: 'tutorial', label: 'Tutorial' },
  { id: 'calibView', label: 'Calib-Aim' },
  { id: 'calibKick', label: 'Calib-Kick' },
  { id: 'warmUp', label: 'WarmUp' },
  { id: 'warmUpDodge', label: 'WarmUp2' },
  { id: 'game', label: 'Game' },
  { id: 'result', label: 'Result' },
]
function devGo(id) {
  if (id === 'game') { store.startGame(); return }
  store.screen = id
}
function devPrev() {
  const idx = screens.findIndex(s => s.id === store.screen)
  if (idx > 0) devGo(screens[idx - 1].id)
}
function devNext() {
  const idx = screens.findIndex(s => s.id === store.screen)
  if (idx < screens.length - 1) devGo(screens[idx + 1].id)
}

// ─── 共享 3D 場景狀態 ───
let scene, camera, renderer, controls, clock
let xrManager = null
const updateCallbacks = []

// 提供給子元件
const sceneApi = {
  getScene: () => scene,
  getCamera: () => camera,
  getRenderer: () => renderer,
  getControls: () => controls,
  getXRManager: () => xrManager,
  onUpdate(fn) { updateCallbacks.push(fn) },
  offUpdate(fn) {
    const idx = updateCallbacks.indexOf(fn)
    if (idx !== -1) updateCallbacks.splice(idx, 1)
  },
}
provide('scene3d', sceneApi)

onMounted(() => {
  const container = sceneContainer.value
  if (!container) return

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a3a2a)
  scene.fog = new THREE.FogExp2(0x1a3a2a, 0.012)

  // Camera
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  )
  camera.position.set(0, 1.6, -6)

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  renderer.xr.enabled = true
  container.appendChild(renderer.domElement)

  // OrbitControls — 非遊戲時自動旋轉
  controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 1.0, -18)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enableZoom = false
  controls.enablePan = false
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.5
  controls.minPolarAngle = Math.PI * 0.3
  controls.maxPolarAngle = Math.PI * 0.55

  // Lighting
  const ambient = new THREE.HemisphereLight(0x87ceeb, 0x2d5a27, 0.6)
  scene.add(ambient)

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
  scene.add(sun)

  const fill = new THREE.DirectionalLight(0xc4e0ff, 0.3)
  fill.position.set(-20, 10, -10)
  scene.add(fill)

  // Stadium spot lights
  createSpotLight(-25, -15)
  createSpotLight(25, -15)
  createSpotLight(-25, 25)
  createSpotLight(25, 25)

  // Stadium
  new Stadium(scene)

  // 展示用足球（非遊戲時顯示）
  const ballGeo = new THREE.SphereGeometry(0.22, 24, 24)
  const ballMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4, metalness: 0.1 })
  const previewBall = new THREE.Mesh(ballGeo, ballMat)
  previewBall.name = 'previewBall'
  previewBall.position.set(0, 0.22, -9)
  previewBall.castShadow = true
  scene.add(previewBall)

  // Clock
  clock = new THREE.Clock()

  // WebXR
  try {
    xrManager = new XRManager(renderer)
    xrManager.onSessionStart(() => {
      console.log('[XR] Session started')
      controls.enabled = false
      controls.autoRotate = false
      // VR 攝影機定位到罰球點，面向球門
      camera.position.set(0, 0, -8)
      camera.rotation.set(0, 0, 0)
      camera.lookAt(0, 1.2, -20)
      // 隱藏展示球
      const pb = scene.getObjectByName('previewBall')
      if (pb) pb.visible = false
    })
    xrManager.onSessionEnd(() => {
      console.log('[XR] Session ended')
      controls.enabled = true
      controls.autoRotate = true
      camera.position.set(0, 1.6, -6)
      controls.target.set(0, 1.0, -18)
      controls.update()
      const pb = scene.getObjectByName('previewBall')
      if (pb) pb.visible = true
    })
    // 加入 VR 按鈕（Three.js VRButton 自動處理支援檢測）
    const vrBtn = xrManager.createVRButton()
    document.body.appendChild(vrBtn)
    // 將控制器加入場景
    xrManager.addToScene(scene)
  } catch (e) {
    console.error('[App] XRManager init failed:', e)
    xrManager = null
  }

  // 如果重整後直接進入 game 畫面，立即設定攝影機
  if (store.screen === 'game') {
    controls.enabled = false
    controls.autoRotate = false
    camera.position.set(0, 2.2, -8.5)
    camera.rotation.set(0, 0, 0)
    camera.rotation.order = 'YXZ'
    camera.lookAt(0, 1.2, -20)
    const pb = scene.getObjectByName('previewBall')
    if (pb) pb.visible = false
  }

  // Resize
  window.addEventListener('resize', onResize)

  // 啟動渲染迴圈（用 setAnimationLoop，WebXR 必要）
  renderer.setAnimationLoop(animate)
})

function createSpotLight(x, z) {
  const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 18, 8)
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.3 })
  const pole = new THREE.Mesh(poleGeo, poleMat)
  pole.position.set(x, 9, z)
  pole.castShadow = true
  scene.add(pole)

  const spot = new THREE.SpotLight(0xfff5e6, 30, 60, Math.PI * 0.3, 0.5, 1)
  spot.position.set(x, 18, z)
  spot.target.position.set(0, 0, 0)
  spot.castShadow = false
  scene.add(spot)
  scene.add(spot.target)
}

function onResize() {
  if (!camera || !renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function animate() {
  if (!renderer || !scene || !camera) return

  const delta = Math.min(clock.getDelta(), 0.05)
  const elapsed = clock.elapsedTime

  // 執行已註冊的更新回調（遊戲物件等）
  for (const cb of updateCallbacks) {
    cb(delta, elapsed)
  }

  // WebXR 控制器位置同步到 store
  if (xrManager?.isInVR) {
    store.isXR = true
    const positions = xrManager.updateControllers()
    if (positions) {
      const w = window.innerWidth
      const h = window.innerHeight
      const projL = positions.left.clone().project(camera)
      const projR = positions.right.clone().project(camera)
      store.updateXRFeet(
        { x: (projL.x * 0.5 + 0.5) * w, y: (-projL.y * 0.5 + 0.5) * h },
        { x: (projR.x * 0.5 + 0.5) * w, y: (-projR.y * 0.5 + 0.5) * h }
      )
    }
  } else {
    store.isXR = false
  }

  // 非遊戲模式且非 VR：OrbitControls 自動旋轉
  if (store.screen !== 'game' && controls && !xrManager?.isInVR) {
    controls.update()
  }

  renderer.render(scene, camera)
}

// 監聽畫面切換，調整攝影機和控制器
watch(() => store.screen, (newScreen, oldScreen) => {
  if (!scene || !camera || !controls) return

  const previewBall = scene.getObjectByName('previewBall')

  if (newScreen === 'game') {
    controls.enabled = false
    controls.autoRotate = false
    // 重設攝影機到罰球點第一人稱視角
    camera.position.set(0, 2.2, -8.5)
    camera.rotation.set(0, 0, 0)
    camera.rotation.order = 'YXZ'
    camera.lookAt(0, 1.2, -20)
    if (previewBall) previewBall.visible = false
  } else if (oldScreen === 'game') {
    // 只有從遊戲離開時才重設攝影機
    controls.enabled = true
    controls.autoRotate = true
    camera.position.set(0, 1.6, -6)
    controls.target.set(0, 1.0, -18)
    camera.rotation.set(0, 0, 0)
    controls.update()
    if (previewBall) previewBall.visible = true
  }
})

onUnmounted(() => {
  if (renderer) {
    renderer.setAnimationLoop(null)
    renderer.dispose()
    renderer.domElement.remove()
  }
  window.removeEventListener('resize', onResize)
  if (controls) controls.dispose()
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;600;700;900&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0a0a0a;
  font-family: 'Outfit', sans-serif;
  color: #fff;
}

#app {
  width: 100%;
  height: 100%;
  position: relative;
}

/* 3D 場景背景 */
.scene-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.scene-bg canvas {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 漸層濾鏡 — 蓋在 3D 場景上面 */
.gradient-filter {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(10, 46, 42, 0.75) 0%,
    rgba(15, 61, 56, 0.6) 25%,
    rgba(26, 90, 82, 0.45) 50%,
    rgba(74, 154, 144, 0.3) 75%,
    rgba(208, 236, 232, 0.2) 100%
  );
  transition: opacity 1.5s ease;
}

.gradient-filter.hidden {
  opacity: 0;
}

/* 交叉淡入淡出 */
.fade-enter-active {
  transition: opacity 0.6s ease 0.1s;
}

.fade-leave-active {
  transition: opacity 0.4s ease;
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ─── DEV 導航列 ─── */
.dev-nav {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  pointer-events: auto;
}

.dev-nav-btn {
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  font-weight: 600;
  padding: 5px 10px;
  border: none;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.dev-nav-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.dev-nav-btn.active {
  background: #00e5a0;
  color: #0a0a0a;
}

.dev-nav-arrows {
  display: flex;
  gap: 2px;
  margin-left: 6px;
  border-left: 1px solid rgba(255, 255, 255, 0.15);
  padding-left: 8px;
}

.dev-nav-arrow {
  font-size: 14px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.dev-nav-arrow:hover {
  background: rgba(0, 229, 160, 0.3);
  color: #fff;
}
</style>
