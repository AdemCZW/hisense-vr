<template>
  <div class="calib-screen">
    <!-- 頂部標題 -->
    <div class="step-header">
      <div class="step-header-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#00e5a0" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="3" fill="#00e5a0"/>
          <line x1="12" y1="2" x2="12" y2="5"/>
          <line x1="12" y1="19" x2="12" y2="22"/>
          <line x1="2" y1="12" x2="5" y2="12"/>
          <line x1="19" y1="12" x2="22" y2="12"/>
        </svg>
      </div>
      <div class="step-header-title">Step1. View Calibration</div>
    </div>

    <!-- 說明 -->
    <div class="instruction-area">
      <p class="instruction-main">Stand still and look at the dot in front of you.</p>
      <p class="instruction-sub">*If you are not detected, please raise your hand for assistance.</p>
    </div>

    <!-- 校準目標 -->
    <div class="calibration-target" :class="{ done: calibDone }">
      <div class="calib-crosshair"></div>
      <div class="corner-mark corner-tl"></div>
      <div class="corner-mark corner-tr"></div>
      <div class="corner-mark corner-bl"></div>
      <div class="corner-mark corner-br"></div>
      <div class="calib-pulse"></div>
      <div class="calib-ring-outer"></div>
      <div class="calib-ring-mid"></div>
      <div class="calib-ring-inner"></div>
      <div class="calib-dot" :class="{ done: calibDone }" :style="calibDone ? { opacity: 0 } : {}"></div>
      <div class="calib-check" :class="{ show: calibDone }">
        <svg viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="16" fill="#00e5a0"/>
          <path d="M10 18 L16 24 L26 12" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>

    <!-- 狀態文字 -->
    <div class="status-text" :class="calibDone ? 'status-done' : 'status-calibrating'">
      {{ calibDone ? 'Calibration Complete!' : 'Calibrating... Please wait.' }}
    </div>

    <!-- Next -->
    <Transition name="btn-pop">
      <button v-if="calibDone" class="next-btn" @click="$emit('complete')">Next Step</button>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

defineEmits(['complete'])
const calibDone = ref(false)
let timer = null

onMounted(() => {
  calibDone.value = false
  timer = setTimeout(() => { calibDone.value = true }, 3000)
})

onUnmounted(() => {
  if (timer) { clearTimeout(timer); timer = null }
})
</script>

<style scoped>
.calib-screen {
  position: fixed; inset: 0;
  z-index: 10;
  font-family: 'Outfit', sans-serif; color: #fff;
}

.step-header {
  position: absolute; top: 0; left: 0; right: 0; height: 56px;
  background: linear-gradient(90deg, rgba(0,95,95,0.9), rgba(0,136,136,0.9), rgba(0,165,160,0.9), rgba(0,136,136,0.9), rgba(0,95,95,0.9));
  display: flex; align-items: center; justify-content: center; gap: 12px;
  z-index: 20; box-shadow: 0 2px 20px rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
  animation: fadeSlideDown 0.5s ease both;
}
.step-header-icon {
  width: 32px; height: 32px; background: rgba(0,0,0,0.3);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
}
.step-header-icon svg { width: 20px; height: 20px; }
.step-header-title { font-size: 22px; font-weight: 700; font-style: italic; }

.instruction-area {
  position: absolute; top: 76px; left: 50%; transform: translateX(-50%);
  text-align: center; z-index: 15;
  animation: fadeIn 0.6s ease 0.3s both;
}
.instruction-main { font-size: 22px; font-weight: 500; margin-bottom: 8px; text-shadow: 0 2px 12px rgba(0,0,0,0.6); }
.instruction-sub { font-size: 14px; color: rgba(0,229,160,0.7); font-style: italic; text-shadow: 0 1px 8px rgba(0,0,0,0.5); }

.calibration-target {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 200px; height: 200px; z-index: 15;
  display: flex; align-items: center; justify-content: center;
}

.calib-ring-outer {
  position: absolute; width: 180px; height: 180px; border-radius: 50%;
  border: 2px solid transparent; border-top: 2px solid #00e5a0;
  border-right: 2px solid rgba(0,229,160,0.4);
  animation: spin 2s linear infinite;
}
.calib-ring-mid {
  position: absolute; width: 150px; height: 150px; border-radius: 50%;
  border: 2px dashed rgba(0,229,160,0.3);
  animation: spin-reverse 3s linear infinite;
}
.calib-ring-inner {
  position: absolute; width: 120px; height: 120px; border-radius: 50%;
  border: 1px solid rgba(0,229,160,0.2);
}
.calib-crosshair { position: absolute; width: 200px; height: 200px; }
.calib-crosshair::before, .calib-crosshair::after { content: ''; position: absolute; background: rgba(0,229,160,0.3); }
.calib-crosshair::before { width: 1px; height: 100%; left: 50%; }
.calib-crosshair::after { width: 100%; height: 1px; top: 50%; }

.corner-mark { position: absolute; width: 20px; height: 20px; border-color: #00e5a0; border-style: solid; border-width: 0; }
.corner-tl { top: 10px; left: 10px; border-top-width: 2px; border-left-width: 2px; }
.corner-tr { top: 10px; right: 10px; border-top-width: 2px; border-right-width: 2px; }
.corner-bl { bottom: 10px; left: 10px; border-bottom-width: 2px; border-left-width: 2px; }
.corner-br { bottom: 10px; right: 10px; border-bottom-width: 2px; border-right-width: 2px; }

.calib-pulse {
  position: absolute; width: 180px; height: 180px; border-radius: 50%;
  border: 1px solid rgba(0,229,160,0.4);
  animation: calib-pulse 2s ease-out infinite;
}
.calib-dot {
  width: 50px; height: 50px; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ffe066, #f5c842, #d4a017);
  box-shadow: 0 0 30px rgba(245,200,66,0.6); z-index: 2; transition: all 0.6s;
}
.calib-dot.done {
  background: radial-gradient(circle at 35% 35%, #33ff99, #00e5a0, #00b87a);
  box-shadow: 0 0 30px rgba(0,229,160,0.6); width: 60px; height: 60px;
}
.calib-check { display: none; position: absolute; z-index: 3; }
.calib-check.show { display: block; animation: popIn 0.4s ease; }
.calib-check svg { width: 36px; height: 36px; }

.calibration-target.done .calib-ring-outer { animation: none; border: 2px solid #00e5a0; }
.calibration-target.done .calib-ring-mid { animation: none; border: 2px solid rgba(0,229,160,0.5); }
.calibration-target.done .calib-pulse { animation: none; opacity: 0; }

.status-text {
  position: absolute; bottom: calc(50% - 150px); left: 50%; transform: translateX(-50%);
  z-index: 15; font-size: 20px; font-weight: 700; font-style: italic; transition: all 0.4s;
  text-shadow: 0 2px 12px rgba(0,0,0,0.6);
}
.status-calibrating { color: #00e5a0; animation: blink 1.5s ease-in-out infinite; }
.status-done { color: #33ff99; }

.next-btn {
  position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
  z-index: 20; font-family: 'Outfit', sans-serif;
  font-size: 18px; font-weight: 700; padding: 14px 50px;
  border: none; border-radius: 50px;
  background: linear-gradient(135deg, #2a7a6a, #1a6a5a);
  color: #fff; cursor: pointer; transition: all 0.25s;
  pointer-events: auto; letter-spacing: 1px;
}
.next-btn:hover { transform: translateX(-50%) scale(1.05); box-shadow: 0 4px 20px rgba(0,229,160,0.2); }

.btn-pop-enter-active { animation: popIn 0.4s ease; }
.btn-pop-leave-active { transition: opacity 0.2s; }
.btn-pop-leave-to { opacity: 0; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spin-reverse { to { transform: rotate(-360deg); } }
@keyframes calib-pulse { 0% { transform: scale(0.6); opacity: 0.8; } 100% { transform: scale(1.3); opacity: 0; } }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
