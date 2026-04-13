<template>
  <div class="calib-screen" @mousemove="onMouseMove">
    <!-- 頂部標題列 -->
    <div class="step-header">
      <div class="step-header-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5">
          <rect x="3" y="7" width="18" height="10" rx="4" stroke="#fff"/>
          <rect x="6" y="9" width="5" height="6" rx="2" fill="rgba(255,255,255,0.3)"/>
          <rect x="13" y="9" width="5" height="6" rx="2" fill="rgba(255,255,255,0.3)"/>
          <line x1="8" y1="17" x2="16" y2="17" stroke="#00e5a0" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="step-header-title">Step1. View Calibration</div>
    </div>

    <!-- 說明文字 -->
    <div class="instruction-area">
      <p class="instruction-main">Stand still and look at the dot in front of you.</p>
      <p class="instruction-sub">*If you are not detected, please raise your hand for assistance.</p>
    </div>

    <!-- 校準準心 -->
    <div class="calib-target" :class="{ done: calibDone }" :style="targetStyle">
      <!-- 外圈旋轉 -->
      <div class="ring ring-outer"></div>
      <div class="ring ring-mid"></div>
      <div class="ring ring-inner"></div>
      <!-- 十字線 -->
      <div class="crosshair"></div>
      <!-- 角落標記 -->
      <div class="corner corner-tl"></div>
      <div class="corner corner-tr"></div>
      <div class="corner corner-bl"></div>
      <div class="corner corner-br"></div>
      <!-- 脈衝圈 -->
      <div class="pulse-ring"></div>
      <!-- 中心圓 / 勾勾 -->
      <div class="center-dot" :class="{ done: calibDone }"></div>
      <div class="check-mark" :class="{ show: calibDone }">
        <svg viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="16" fill="#00e5a0"/>
          <path d="M10 18 L16 24 L26 12" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>

    <!-- 狀態文字 -->
    <div class="status-text" :class="calibDone ? 'done' : 'calibrating'">
      {{ calibDone ? 'Calibration Complete!' : 'Calibrating... Please wait.' }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['complete'])
const calibDone = ref(false)
const targetStyle = reactive({ transform: 'translate(-50%, -50%)' })
let timer = null

function onMouseMove(e) {
  if (calibDone.value) return
  // 準心跟隨滑鼠，但限制在中央區域
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  const dx = (e.clientX - cx) * 0.08
  const dy = (e.clientY - cy) * 0.08
  targetStyle.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`
}

onMounted(() => {
  calibDone.value = false
  timer = setTimeout(() => {
    calibDone.value = true
    targetStyle.transform = 'translate(-50%, -50%)'
    // 完成後 1.5 秒自動跳下一頁
    setTimeout(() => { emit('complete') }, 1500)
  }, 3000)
})

onUnmounted(() => { if (timer) clearTimeout(timer) })
</script>

<style scoped>
.calib-screen {
  position: fixed;
  inset: 0;
  z-index: 10;
  font-family: 'Outfit', sans-serif;
  color: #fff;
  cursor: none;
}

/* ─── 頂部標題列 ─── */
.step-header {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: clamp(44px, 6vh, 64px);
  background: linear-gradient(90deg, rgba(0,95,95,0.92), rgba(0,150,145,0.92), rgba(0,180,170,0.92), rgba(0,150,145,0.92), rgba(0,95,95,0.92));
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(8px, 1vw, 16px);
  z-index: 20;
  box-shadow: 0 2px 20px rgba(0,0,0,0.5);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  animation: fadeSlideDown 0.5s ease both;
}

.step-header-icon {
  width: clamp(28px, 3vw, 40px);
  height: clamp(28px, 3vw, 40px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-header-icon svg {
  width: 100%;
  height: 100%;
}

.step-header-title {
  font-size: clamp(16px, 1.8vw, 28px);
  font-weight: 700;
  font-style: italic;
  letter-spacing: 0.02em;
}

/* ─── 說明文字 ─── */
.instruction-area {
  position: absolute;
  top: clamp(52px, 8vh, 80px);
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 15;
  animation: fadeIn 0.6s ease 0.3s both;
}

.instruction-main {
  font-size: clamp(16px, 1.6vw, 26px);
  font-weight: 600;
  margin-bottom: clamp(4px, 0.8vh, 10px);
  text-shadow: 0 2px 12px rgba(0,0,0,0.7);
}

.instruction-sub {
  font-size: clamp(11px, 1.1vw, 16px);
  color: rgba(0,229,160,0.8);
  font-style: italic;
  text-shadow: 0 1px 8px rgba(0,0,0,0.5);
}

/* ─── 校準準心 ─── */
.calib-target {
  position: absolute;
  top: 50%;
  left: 50%;
  width: clamp(140px, 16vw, 240px);
  height: clamp(140px, 16vw, 240px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 15;
  transition: transform 0.15s ease-out;
}

/* 旋轉環 */
.ring {
  position: absolute;
  border-radius: 50%;
}

.ring-outer {
  width: 90%;
  height: 90%;
  border: 2px solid transparent;
  border-top: 2px solid #00e5a0;
  border-right: 2px solid rgba(0,229,160,0.4);
  animation: spin 2s linear infinite;
}

.ring-mid {
  width: 75%;
  height: 75%;
  border: 2px dashed rgba(0,229,160,0.3);
  animation: spinReverse 3s linear infinite;
}

.ring-inner {
  width: 60%;
  height: 60%;
  border: 1px solid rgba(0,229,160,0.2);
}

/* 十字線 */
.crosshair {
  position: absolute;
  width: 100%;
  height: 100%;
}

.crosshair::before,
.crosshair::after {
  content: '';
  position: absolute;
  background: rgba(0,229,160,0.25);
}

.crosshair::before { width: 1px; height: 100%; left: 50%; }
.crosshair::after { width: 100%; height: 1px; top: 50%; }

/* 角落標記 */
.corner {
  position: absolute;
  width: 12%;
  height: 12%;
  border-color: #00e5a0;
  border-style: solid;
  border-width: 0;
}

.corner-tl { top: 5%; left: 5%; border-top-width: 2px; border-left-width: 2px; }
.corner-tr { top: 5%; right: 5%; border-top-width: 2px; border-right-width: 2px; }
.corner-bl { bottom: 5%; left: 5%; border-bottom-width: 2px; border-left-width: 2px; }
.corner-br { bottom: 5%; right: 5%; border-bottom-width: 2px; border-right-width: 2px; }

/* 脈衝圈 */
.pulse-ring {
  position: absolute;
  width: 90%;
  height: 90%;
  border-radius: 50%;
  border: 1px solid rgba(0,229,160,0.4);
  animation: pulse 2s ease-out infinite;
}

/* 中心黃色圓 */
.center-dot {
  width: 25%;
  height: 25%;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ffe066, #f5c842, #d4a017);
  box-shadow: 0 0 30px rgba(245,200,66,0.6);
  z-index: 2;
  transition: all 0.6s ease;
}

.center-dot.done {
  opacity: 0;
  transform: scale(0.5);
}

/* 完成勾勾 */
.check-mark {
  display: none;
  position: absolute;
  z-index: 3;
}

.check-mark.show {
  display: block;
  animation: popIn 0.4s ease;
}

.check-mark svg {
  width: clamp(28px, 3vw, 44px);
  height: clamp(28px, 3vw, 44px);
}

/* 完成態 */
.calib-target.done .ring-outer { animation: none; border: 2px solid #00e5a0; }
.calib-target.done .ring-mid { animation: none; border: 2px solid rgba(0,229,160,0.5); }
.calib-target.done .pulse-ring { animation: none; opacity: 0; }

/* ─── 狀態文字 ─── */
.status-text {
  position: absolute;
  bottom: clamp(60px, 12vh, 120px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 15;
  font-size: clamp(16px, 1.8vw, 28px);
  font-weight: 700;
  font-style: italic;
  text-shadow: 0 2px 16px rgba(0,0,0,0.6);
  transition: all 0.4s ease;
}

.status-text.calibrating {
  color: #00e5a0;
  animation: blink 1.5s ease-in-out infinite;
}

.status-text.done {
  color: #33ff99;
}

/* ─── 動畫 ─── */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spinReverse { to { transform: rotate(-360deg); } }
@keyframes pulse { 0% { transform: scale(0.6); opacity: 0.8; } 100% { transform: scale(1.3); opacity: 0; } }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
