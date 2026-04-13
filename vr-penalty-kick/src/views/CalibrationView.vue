<template>
  <div class="calib-screen" @mousemove="onMouseMove">
    <!-- 頂部標題 + 說明（圖片） -->
    <div class="top-area">
      <img src="../assets/images/7-step1@4x.png" alt="Step1" class="step-header-img" />
    </div>

    <!-- 中央準心區域 -->
    <div class="center-area">
      <!-- 準心圓環圖片（旋轉） -->
      <div class="circle-wrap" :class="{ done: calibDone }">
        <img src="../assets/images/7-circle@4x.png" alt="" class="circle-img" :class="{ spinning: !calibDone }" />

        <!-- 黃色滑鼠圓點（校準中） -->
        <div v-if="!calibDone" class="mouse-dot" :style="dotStyle"></div>

        <!-- 打勾動畫（校準完成） -->
        <div v-if="calibDone" class="check-anim">
          <svg viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" fill="rgba(0,229,160,0.15)"/>
            <circle cx="40" cy="40" r="28" fill="#00e5a0"/>
            <path class="check-path" d="M22 40 L34 52 L58 28" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- 底部提示文字（圖片） -->
    <div class="bottom-area">
      <img v-if="!calibDone" src="../assets/images/7-hint@4x.png" alt="Calibrating" class="hint-img" />
      <div v-else class="complete-text">Calibration Complete!</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['complete'])
const calibDone = ref(false)
const dotStyle = reactive({ left: '50%', top: '50%' })

// 對準計時：滑鼠停在中心區域內持續 1.5 秒才算校準成功
let holdTimer = null
const HOLD_DURATION = 1500  // 需要持續對準的毫秒數
const CENTER_THRESHOLD = 0.12 // 中心區域佔圓環寬度的比例

function onMouseMove(e) {
  if (calibDone.value) return
  const el = document.querySelector('.circle-wrap')
  if (!el) return
  const box = el.getBoundingClientRect()
  const cx = box.left + box.width / 2
  const cy = box.top + box.height / 2
  const dx = e.clientX - cx
  const dy = e.clientY - cy
  const maxR = box.width * 0.3
  const dist = Math.sqrt(dx * dx + dy * dy)
  const clampDist = Math.min(dist, maxR)
  const angle = Math.atan2(dy, dx)
  const finalX = Math.cos(angle) * clampDist
  const finalY = Math.sin(angle) * clampDist
  dotStyle.left = `calc(50% + ${finalX}px)`
  dotStyle.top = `calc(50% + ${finalY}px)`

  // 判斷是否在中心區域內
  const centerR = box.width * CENTER_THRESHOLD
  if (dist < centerR) {
    // 在中心，開始計時（如果還沒開始）
    if (!holdTimer) {
      holdTimer = setTimeout(() => {
        calibDone.value = true
        setTimeout(() => { emit('complete') }, 1800)
      }, HOLD_DURATION)
    }
  } else {
    // 離開中心，重置計時
    if (holdTimer) {
      clearTimeout(holdTimer)
      holdTimer = null
    }
  }
}

onMounted(() => {
  calibDone.value = false
})

onUnmounted(() => {
  if (holdTimer) { clearTimeout(holdTimer); holdTimer = null }
})
</script>

<style scoped>
.calib-screen {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 5vh 0;
  cursor: none;
}

/* ─── 頂部 ─── */
.top-area {
  width: 100%;
  display: flex;
  justify-content: center;
  animation: fadeSlideDown 0.5s ease both;
}

.step-header-img {
  width: clamp(400px, 55vw, 900px);
  height: auto;
  filter: drop-shadow(0 0.4vh 1.5vw rgba(0,0,0,0.4));
}

/* ─── 中央準心 ─── */
.center-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle-wrap {
  position: relative;
  width: clamp(150px, 20vw, 300px);
  height: clamp(150px, 20vw, 300px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 2vw rgba(0,229,160,0.4));
}

.circle-img.spinning {
  animation: spin 4s linear infinite;
}

.circle-wrap.done .circle-img {
  animation: none;
  opacity: 0.5;
  transition: opacity 0.6s ease;
}

/* 黃色滑鼠圓點 */
.mouse-dot {
  position: absolute;
  width: 22%;
  height: 22%;
  border-radius: 50%;
  background: radial-gradient(circle at 38% 35%, #ffe066, #f5c842, #d4a017);
  box-shadow: 0 0 1.5vw rgba(245,200,66,0.7);
  transform: translate(-50%, -50%);
  transition: left 0.1s ease-out, top 0.1s ease-out;
  z-index: 3;
}

/* 打勾動畫 */
.check-anim {
  position: absolute;
  width: 55%;
  height: 55%;
  animation: popIn 0.5s ease;
  z-index: 4;
}

.check-anim svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 1.5vw rgba(0,229,160,0.6));
}

.check-path {
  stroke-dasharray: 60;
  stroke-dashoffset: 60;
  animation: drawCheck 0.5s ease 0.2s forwards;
}

/* ─── 底部 ─── */
.bottom-area {
  display: flex;
  justify-content: center;
  animation: fadeIn 0.6s ease 0.3s both;
}

.hint-img {
  width: clamp(200px, 28vw, 450px);
  height: auto;
  animation: blink 2s ease-in-out infinite;
}

.complete-text {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(18px, 2.2vw, 32px);
  font-weight: 700;
  font-style: italic;
  color: #33ff99;
  text-shadow: 0 0 2vw rgba(0,229,160,0.5);
  animation: popIn 0.4s ease;
}

/* ─── 動畫 ─── */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
@keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes drawCheck { to { stroke-dashoffset: 0; } }
@keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-2vh); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
