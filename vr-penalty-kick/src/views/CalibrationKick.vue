<template>
  <div class="calib-screen">
    <!-- ============ Phase 1: 踢球校正 ============ -->
    <template v-if="phase === 'kick'">
      <!-- 頂部標題圖片 (與 Step1 同尺寸) -->
      <div class="top-area">
        <img :src="stepImg" alt="Step2. Kick Calibration" class="step-header-img" />
      </div>

      <!-- 足球 + 雙腳互動區域 -->
      <div class="kick-scene" @mousemove="onMouseMove" @click="handleKick">
        <!-- 足球 -->
        <div class="football-wrapper" ref="footballRef">
          <img
            :src="footNearBall ? footballGlow : footballNormal"
            alt="football"
            class="football-img"
            :class="{ glowing: footNearBall }"
          />
        </div>

        <!-- 左腳 (固定 / XR 時跟隨左手控制器) -->
        <div class="foot" :class="store.isXR ? 'foot-follow' : 'foot-static-left'" :style="store.isXR ? leftFootStyle : {}">
          <img :src="footLeftImg" alt="left foot" class="foot-img" />
        </div>

        <!-- 右腳 (跟隨滑鼠 / XR 時跟隨右手控制器) -->
        <div class="foot foot-follow" :style="rightFootStyle">
          <img :src="footRightImg" alt="right foot" class="foot-img" />
        </div>
      </div>

    </template>

    <!-- ============ Phase 2: Get Ready 過場 ============ -->
    <Transition name="fade-in">
      <div v-if="phase === 'getready'" class="getready-overlay">
        <div class="getready-content">
          <img :src="mascotsImg" alt="mascots" class="mascots-img" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/gameStore.js'

import stepImg from '../assets/images/7-step2@4x.png'
import footballNormal from '../assets/images/8-足球@4x.png'
import footballGlow from '../assets/images/7-football@4x.png'
import footLeftImg from '../assets/images/7-左腳@4x.png'
import footRightImg from '../assets/images/7-右腳@4x.png'
import mascotsImg from '../assets/images/6-hint2@4x.png'

const emit = defineEmits(['complete'])
const store = useGameStore()

const phase = ref('kick') // 'kick' → 'getready'
const footNearBall = ref(false)
const footballRef = ref(null)
let readyTimer = null

const footPos = reactive({ x: 0, y: 0 })
const rightFootStyle = ref({
  top: '100%',
  left: '64%',
  transform: 'translate(-50%, -50%)',
})
const leftFootStyle = ref({
  top: '100%',
  left: '36%',
  transform: 'translate(-50%, -50%)',
})

// XR 模式：雙控制器驅動雙腳
watch(
  () => [store.xrLeftFoot, store.xrRightFoot],
  ([lf, rf]) => {
    if (!store.isXR || phase.value !== 'kick') return
    leftFootStyle.value = {
      left: `${lf.x}px`,
      top: `${lf.y}px`,
      transform: 'translate(-50%, -50%)',
    }
    rightFootStyle.value = {
      left: `${rf.x}px`,
      top: `${rf.y}px`,
      transform: 'translate(-50%, -50%)',
    }
  },
  { deep: true }
)

function onMouseMove(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  footPos.x = e.clientX - rect.left
  footPos.y = e.clientY - rect.top

  rightFootStyle.value = {
    left: `${footPos.x}px`,
    top: `${footPos.y}px`,
    transform: 'translate(-50%, -50%)',
  }

  // 檢查右腳是否接近球
  if (footballRef.value) {
    const ballRect = footballRef.value.getBoundingClientRect()
    const ballCenterX = ballRect.left + ballRect.width / 2 - rect.left
    const ballCenterY = ballRect.top + ballRect.height / 2 - rect.top
    const dist = Math.sqrt((footPos.x - ballCenterX) ** 2 + (footPos.y - ballCenterY) ** 2)
    const threshold = ballRect.width * 0.8
    footNearBall.value = dist < threshold
  }
}

function handleKick() {
  if (footNearBall.value) {
    goToGetReady()
  }
}

function goToGetReady() {
  phase.value = 'getready'
  readyTimer = setTimeout(() => {
    emit('complete')
  }, 2500)
}

onMounted(() => {
  phase.value = 'kick'
})

onUnmounted(() => {
  if (readyTimer) { clearTimeout(readyTimer); readyTimer = null }
})
</script>

<style scoped>
.calib-screen {
  position: fixed; inset: 0;
  z-index: 10;
  font-family: 'Outfit', sans-serif; color: #fff;
  cursor: none;
}

/* ─── 頂部標題（與 Step1 同尺寸） ─── */
.top-area {
  position: absolute; top: 0; left: 0; right: 0;
  z-index: 20;
  display: flex; justify-content: center;
  pointer-events: none;
  animation: fadeSlideDown 0.5s ease both;
}
.step-header-img {
  width: 80%;
  max-width: 700px;
  height: auto;
  margin-top: 11vh;
  filter: drop-shadow(0 0.4vh 1.5vw rgba(0,0,0,0.4));
}

/* ─── 互動場景 ─── */
.kick-scene {
  position: absolute; inset: 0;
  z-index: 10; overflow: hidden;
}

/* ─── 足球（加大） ─── */
.football-wrapper {
  position: absolute;
  bottom: 18%; left: 50%; transform: translateX(-50%);
  width: clamp(140px, 16vw, 220px);
  height: clamp(140px, 16vw, 220px);
  display: flex; align-items: center; justify-content: center;
}
.football-img {
  width: 100%; height: 100%; object-fit: contain;
  transition: all 0.3s ease;
  filter: drop-shadow(0 4px 20px rgba(0,0,0,0.5));
}
.football-img.glowing {
  width: 120%; height: 120%;
  filter: drop-shadow(0 0 30px rgba(245,200,66,0.6)) drop-shadow(0 0 60px rgba(245,200,66,0.3));
  animation: ball-glow-pulse 1.2s ease-in-out infinite;
}

/* ─── 鞋子共用（加大） ─── */
.foot {
  position: absolute;
  width: clamp(320px, 32vw, 540px);
  height: clamp(400px, 40vw, 680px);
  pointer-events: none; z-index: 12;
}
.foot-img {
  width: 100%; height: 100%; object-fit: contain;
  filter: drop-shadow(0 6px 20px rgba(0,0,0,0.5));
}

/* 左腳 — 固定在畫面左下角 */
.foot-static-left {
  bottom: -22%; left: 36%;
  transform: translateX(-50%);
}

/* 右腳 — 跟隨滑鼠 */
.foot-follow {
}

/* ─── 狀態文字 ─── */
.kick-status {
  position: absolute; bottom: 40%; left: 50%; transform: translateX(-50%);
  z-index: 15; text-align: center;
}
.kick-status-text {
  font-size: clamp(14px, 1.6vw, 20px); font-weight: 600; font-style: italic;
  color: rgba(255,255,255,0.5);
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}
.kick-status-text.waiting { animation: subtle-blink 2s ease-in-out infinite; }

/* ─── Phase 2: Get Ready ─── */
.getready-overlay {
  position: fixed; inset: 0;
  z-index: 30;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}
.getready-content {
  display: flex; flex-direction: column; align-items: center; gap: 20px;
  animation: popIn 0.6s ease both;
}
.mascots-img {
  width: 360px; max-width: 80vw; height: auto;
  filter: drop-shadow(0 8px 30px rgba(0,0,0,0.4));
}
.getready-text {
  font-size: 42px; font-weight: 900; font-style: italic;
  text-transform: uppercase; letter-spacing: 2px;
  text-shadow: 0 4px 20px rgba(0,0,0,0.6);
}
.getready-sub {
  font-size: 20px; font-weight: 500; font-style: italic;
  color: rgba(255,255,255,0.7);
  text-shadow: 0 2px 10px rgba(0,0,0,0.4);
  margin-top: -10px;
}

/* ─── Transitions ─── */
.fade-in-enter-active { transition: opacity 0.5s ease; }
.fade-in-leave-active { transition: opacity 0.3s ease; }
.fade-in-enter-from, .fade-in-leave-to { opacity: 0; }

/* ─── Keyframes ─── */
@keyframes ball-glow-pulse {
  0%, 100% { filter: drop-shadow(0 0 30px rgba(245,200,66,0.6)) drop-shadow(0 0 60px rgba(245,200,66,0.3)); }
  50% { filter: drop-shadow(0 0 40px rgba(245,200,66,0.8)) drop-shadow(0 0 70px rgba(245,200,66,0.5)); }
}
@keyframes subtle-blink { 0%,100% { opacity: 0.7; } 50% { opacity: 0.3; } }
@keyframes popIn { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
