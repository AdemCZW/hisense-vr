<template>
  <div id="app">
    <!-- 持久 3D 球場背景 -->
    <div ref="sceneContainer" class="scene-bg"></div>
    <div class="scene-overlay" :class="{ dimmed: store.screen !== 'game' }"></div>

    <!-- UI 覆蓋層 — 各畫面切換 -->
    <Transition name="screen" mode="out-in">
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

import StartScreen from './views/StartScreen.vue'
import TutorialScreen from './views/TutorialScreen.vue'
import CalibrationView from './views/CalibrationView.vue'
import CalibrationKick from './views/CalibrationKick.vue'
import GameView from './views/GameView.vue'
import ResultScreen from './views/ResultScreen.vue'

const store = useGameStore()
const sceneContainer = ref(null)

// ─── 共享 3D 場景狀態 ───
let scene, camera, renderer, controls, clock
let animFrameId = null
const updateCallbacks = []

// 提供給子元件
const sceneApi = {
  getScene: () => scene,
  getCamera: () => camera,
  getRenderer: () => renderer,
  getControls: () => controls,
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
  camera.position.set(0, 3, 5)

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
  controls.target.set(0, 1.2, -15)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enableZoom = false
  controls.enablePan = false
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.6
  controls.minPolarAngle = Math.PI * 0.25
  controls.maxPolarAngle = Math.PI * 0.6

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

  // Resize
  window.addEventListener('resize', onResize)

  // 啟動渲染迴圈
  animate()
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
  animFrameId = requestAnimationFrame(animate)
  if (!renderer || !scene || !camera) return

  const delta = Math.min(clock.getDelta(), 0.05)
  const elapsed = clock.elapsedTime

  // 執行已註冊的更新回調（遊戲物件等）
  for (const cb of updateCallbacks) {
    cb(delta, elapsed)
  }

  // 非遊戲模式：OrbitControls 自動旋轉
  if (store.screen !== 'game' && controls) {
    controls.update()
  }

  renderer.render(scene, camera)
}

// 監聽畫面切換，調整攝影機和控制器
watch(() => store.screen, (newScreen) => {
  if (!scene || !camera || !controls) return

  const previewBall = scene.getObjectByName('previewBall')

  if (newScreen === 'game') {
    // 進入遊戲：停用 OrbitControls，切到第一人稱
    controls.enabled = false
    controls.autoRotate = false
    if (previewBall) previewBall.visible = false
  } else {
    // 離開遊戲：恢復 OrbitControls
    controls.enabled = true
    controls.autoRotate = true
    camera.position.set(0, 3, 5)
    controls.target.set(0, 1.2, -15)
    camera.rotation.set(0, 0, 0)
    controls.update()
    if (previewBall) previewBall.visible = true
  }
})

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  window.removeEventListener('resize', onResize)
  if (renderer) {
    renderer.dispose()
    renderer.domElement.remove()
  }
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

/* 3D 場景背景 — 永遠存在 */
.scene-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.scene-bg canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* 半透明遮罩 — 非遊戲時壓暗背景 */
.scene-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  transition: background 0.6s ease;
  background: transparent;
}

.scene-overlay.dimmed {
  background: radial-gradient(
    ellipse 90% 80% at 50% 45%,
    rgba(10, 26, 18, 0.2),
    rgba(10, 26, 18, 0.6)
  );
}

/* 頁面切換過渡 */
.screen-enter-active,
.screen-leave-active {
  transition: opacity 0.4s ease;
}

.screen-enter-from,
.screen-leave-to {
  opacity: 0;
}
</style>
