<template>
  <div class="calib-screen">
    <!-- 頂部標題 -->
    <div class="step-header">
      <div class="step-header-icon">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#00e5a0" stroke-width="2">
          <path d="M12 22c-4-3-8-7-8-12a8 8 0 1116 0c0 5-4 9-8 12z"/>
          <circle cx="12" cy="10" r="3" fill="#00e5a0"/>
        </svg>
      </div>
      <div class="step-header-title">Step2. Kick Calibration</div>
    </div>

    <!-- 說明 -->
    <div class="instruction-area">
      <p class="instruction-main">Try a gentle kick</p>
      <p class="instruction-sub">
        *If detected, you're ready to start.<br>
        *If your kicks are not detected, please raise your hand for assistance.
      </p>
    </div>

    <!-- 踢球提示箭頭 -->
    <div v-if="!detected" class="kick-arrow">
      <svg width="50" height="40" viewBox="0 0 50 40" fill="none">
        <path d="M25 0 L45 25 L35 25 L35 40 L15 40 L15 25 L5 25 Z" fill="rgba(0,229,160,0.5)" transform="rotate(180 25 20)"/>
      </svg>
    </div>

    <!-- 足球 -->
    <div class="football-area">
      <div class="football-wrapper" :class="{ detected }" @click="handleKick">
        <div class="football-glow"></div>
        <svg class="football-svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="#f0f0f0" stroke="#ccc" stroke-width="1"/>
          <path d="M50 5 L62 20 L50 28 L38 20Z" fill="#2a2a2a" opacity="0.8"/>
          <path d="M95 50 L80 62 L72 50 L80 38Z" fill="#2a2a2a" opacity="0.8"/>
          <path d="M50 95 L38 80 L50 72 L62 80Z" fill="#2a2a2a" opacity="0.8"/>
          <path d="M5 50 L20 38 L28 50 L20 62Z" fill="#2a2a2a" opacity="0.8"/>
          <path d="M50 28 L72 50 L50 72 L28 50Z" fill="#2a2a2a" opacity="0.15"/>
          <ellipse cx="38" cy="35" rx="15" ry="12" fill="rgba(255,255,255,0.3)"/>
          <path d="M25 70 Q50 60 75 70" fill="none" stroke="#00b8a0" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
        </svg>
      </div>
    </div>

    <!-- 雙腳 -->
    <div class="feet-area">
      <div class="foot">
        <svg viewBox="0 0 80 120">
          <rect x="20" y="0" width="36" height="55" rx="12" fill="#f0f0f0"/>
          <rect x="22" y="20" width="32" height="16" rx="5" fill="#1a1a2e" stroke="#555" stroke-width="1"/>
          <circle cx="38" cy="28" r="2" fill="#00e5a0" opacity="0.8"/>
          <path d="M12 55 Q10 65 8 80 Q6 100 15 110 Q25 118 50 115 Q65 112 68 100 Q70 88 55 55Z" fill="#2dd4a8"/>
          <path d="M15 75 Q35 70 55 75" fill="none" stroke="#1a8a6a" stroke-width="2"/>
          <path d="M10 105 Q30 115 55 110" fill="none" stroke="#333" stroke-width="3"/>
        </svg>
      </div>
      <div class="foot">
        <svg viewBox="0 0 80 120" style="transform: scaleX(-1)">
          <rect x="20" y="0" width="36" height="55" rx="12" fill="#f0f0f0"/>
          <rect x="22" y="20" width="32" height="16" rx="5" fill="#1a1a2e" stroke="#555" stroke-width="1"/>
          <circle cx="38" cy="28" r="2" fill="#00e5a0" opacity="0.8"/>
          <path d="M12 55 Q10 65 8 80 Q6 100 15 110 Q25 118 50 115 Q65 112 68 100 Q70 88 55 55Z" fill="#2dd4a8"/>
          <path d="M15 75 Q35 70 55 75" fill="none" stroke="#1a8a6a" stroke-width="2"/>
          <path d="M10 105 Q30 115 55 110" fill="none" stroke="#333" stroke-width="3"/>
        </svg>
      </div>
    </div>

    <!-- 狀態 -->
    <div class="kick-status">
      <span class="kick-status-text" :class="detected ? 'detected' : 'waiting'">
        {{ detected ? 'Kick Detected! Ready to play.' : 'Waiting for kick detection...' }}
      </span>
    </div>

    <!-- Start Game -->
    <button v-if="detected" class="next-btn" @click="$emit('complete')">Start Game!</button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useGameStore } from '../stores/gameStore.js'

defineEmits(['complete'])
const store = useGameStore()
const detected = ref(false)
let timer = null

function handleKick() {
  detected.value = true
}

// 進入此畫面才開始偵測計時
watch(() => store.screen, (screen) => {
  if (screen === 'calibKick') {
    detected.value = false
    timer = setTimeout(() => { if (!detected.value) detected.value = true }, 4000)
  } else {
    if (timer) { clearTimeout(timer); timer = null }
  }
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
}
.step-header-icon {
  width: 32px; height: 32px; background: rgba(0,0,0,0.3);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
}
.step-header-title { font-size: 22px; font-weight: 700; font-style: italic; }

.instruction-area {
  position: absolute; top: 72px; left: 50%; transform: translateX(-50%);
  text-align: center; z-index: 15; width: 90%; max-width: 540px;
}
.instruction-main { font-size: 24px; font-weight: 600; margin-bottom: 12px; text-shadow: 0 2px 12px rgba(0,0,0,0.6); }
.instruction-sub { font-size: 13px; color: rgba(0,229,160,0.7); font-style: italic; line-height: 1.6; text-shadow: 0 1px 8px rgba(0,0,0,0.5); }

.kick-arrow {
  position: absolute; bottom: 25%; left: 50%; transform: translateX(-50%);
  z-index: 12; animation: kick-hint 1.5s ease-in-out infinite;
}

.football-area {
  position: absolute; bottom: 12%; left: 50%; transform: translateX(-50%);
  z-index: 10; display: flex; flex-direction: column; align-items: center;
  pointer-events: auto;
}
.football-wrapper {
  position: relative; width: 140px; height: 140px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.football-svg { width: 100px; height: 100px; filter: drop-shadow(0 4px 20px rgba(0,0,0,0.5)); transition: all 0.6s; }
.football-glow {
  position: absolute; width: 120px; height: 120px; border-radius: 50%;
  background: radial-gradient(circle, rgba(245,200,66,0.15) 0%, transparent 70%); transition: all 0.6s;
}
.football-wrapper.detected .football-glow {
  width: 160px; height: 160px;
  background: radial-gradient(circle, rgba(245,200,66,0.5) 0%, rgba(245,200,66,0.15) 50%, transparent 70%);
  animation: glow-pulse 1.5s ease-in-out infinite;
}

.feet-area {
  position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%);
  z-index: 8; display: flex; gap: 60px;
}
.foot { width: 80px; height: 120px; }
.foot svg { width: 100%; height: 100%; filter: drop-shadow(0 4px 15px rgba(0,0,0,0.4)); }

.kick-status {
  position: absolute; bottom: 36%; left: 50%; transform: translateX(-50%);
  z-index: 15; text-align: center;
}
.kick-status-text { font-size: 18px; font-weight: 600; font-style: italic; color: rgba(255,255,255,0.5); text-shadow: 0 2px 8px rgba(0,0,0,0.5); }
.kick-status-text.waiting { animation: subtle-blink 2s ease-in-out infinite; }
.kick-status-text.detected { color: #00e5a0; font-size: 22px; }

.next-btn {
  position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
  z-index: 20; font-family: 'Outfit', sans-serif;
  font-size: 18px; font-weight: 700; padding: 14px 50px;
  border: none; border-radius: 50px;
  background: linear-gradient(135deg, #00e5a0, #00b8d4);
  color: #0a1a12; cursor: pointer; transition: all 0.25s; letter-spacing: 1px;
  pointer-events: auto;
}
.next-btn:hover { transform: translateX(-50%) scale(1.05); filter: brightness(1.1); }

@keyframes glow-pulse { 0%,100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.15); opacity: 1; } }
@keyframes kick-hint { 0%,100% { transform: translateX(-50%) translateY(0); opacity: 0.6; } 50% { transform: translateX(-50%) translateY(-15px); opacity: 1; } }
@keyframes subtle-blink { 0%,100% { opacity: 0.7; } 50% { opacity: 0.3; } }
</style>
