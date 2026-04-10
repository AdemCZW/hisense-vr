<template>
  <div class="tutorial-screen">
    <!-- 步驟指示器 -->
    <div class="step-indicator">
      <div
        v-for="(step, i) in steps"
        :key="i"
        class="step-dot"
        :class="{ active: currentStep === i, done: currentStep > i }"
        @click="currentStep = i"
      >
        <span class="step-num">{{ i + 1 }}</span>
      </div>
      <div class="step-line">
        <div class="step-line-fill" :style="{ width: `${(currentStep / (steps.length - 1)) * 100}%` }"></div>
      </div>
    </div>

    <!-- cut2: 裝備佩戴提示 -->
    <transition name="slide" mode="out-in">
      <div v-if="currentStep === 0" key="equip" class="tutorial-content">
        <div class="dialog-card">
          <div class="alert-banner">
            <span class="alert-icon">!</span>
            <p class="alert-text">
              Before the game begins, please follow the staff's<br>
              instructions to put on the equipment.
            </p>
          </div>

          <div class="equipment-row">
            <div class="equip-card" v-for="eq in equipment" :key="eq.step">
              <span class="step-tag">Step{{ eq.step }}.</span>
              <span class="equip-name">{{ eq.name }}</span>
              <div class="equip-image-box">
                <svg v-if="eq.step === 1" viewBox="0 0 120 80" class="equip-svg">
                  <rect x="15" y="15" width="90" height="50" rx="25" fill="none" stroke="#aaa" stroke-width="2"/>
                  <circle cx="40" cy="40" r="14" fill="none" stroke="#aaa" stroke-width="2"/>
                  <circle cx="80" cy="40" r="14" fill="none" stroke="#aaa" stroke-width="2"/>
                </svg>
                <svg v-else-if="eq.step === 2" viewBox="0 0 120 80" class="equip-svg">
                  <rect x="25" y="10" width="70" height="55" rx="12" fill="#1a1a2e" stroke="#555" stroke-width="2"/>
                  <rect x="35" y="18" width="50" height="30" rx="6" fill="#0d0d1a" stroke="#444" stroke-width="1"/>
                  <rect x="42" y="55" width="36" height="8" rx="4" fill="#333"/>
                </svg>
                <svg v-else viewBox="0 0 120 80" class="equip-svg">
                  <rect x="10" y="15" width="100" height="45" rx="10" fill="#e8e8e8" stroke="#ccc" stroke-width="1"/>
                  <rect x="15" y="20" width="40" height="30" rx="6" fill="#222"/>
                  <rect x="65" y="20" width="40" height="30" rx="6" fill="#222"/>
                  <rect x="0" y="30" width="14" height="15" rx="4" fill="#ddd"/>
                  <line x1="40" y1="60" x2="80" y2="60" stroke="#00b8a0" stroke-width="3" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- cut3: 體驗協助提醒 -->
    <transition name="slide" mode="out-in">
      <div v-if="currentStep === 1" key="assist" class="tutorial-content">
        <div class="dialog-card">
          <div class="alert-banner">
            <span class="alert-icon">!</span>
            <p class="alert-text">
              If you feel uncomfortable or have any questions,<br>
              please raise your hand and inform the staff.
            </p>
          </div>

          <div class="assist-figure">
            <svg viewBox="0 0 200 280" width="140" height="240" class="figure-svg">
              <ellipse cx="100" cy="42" rx="20" ry="22" fill="#d4d4d4"/>
              <rect x="74" y="32" width="52" height="22" rx="7" fill="#e8e8e8" stroke="#ccc"/>
              <rect x="78" y="36" width="18" height="14" rx="4" fill="#333"/>
              <rect x="104" y="36" width="18" height="14" rx="4" fill="#333"/>
              <path d="M82 64 Q100 70 118 64 L122 150 Q100 158 78 150Z" fill="#f0f0f0"/>
              <path d="M78 68 L58 120 L64 124 L82 76" fill="#f0f0f0"/>
              <path d="M122 68 L150 32 L156 34 L128 72" fill="#f0f0f0"/>
              <circle cx="152" cy="26" r="9" fill="#d4d4d4"/>
              <path d="M84 148 L78 240 L92 240 L100 170 L108 240 L122 240 L116 148Z" fill="#f0f0f0"/>
              <rect x="74" y="236" width="20" height="10" rx="4" fill="#2a6a4a"/>
              <rect x="106" y="236" width="20" height="10" rx="4" fill="#2a6a4a"/>
            </svg>
            <div class="exclaim-badge"><span>!</span></div>
          </div>

          <div class="kick-prompt-box">
            Kick your foot once to start the game.
          </div>
        </div>
      </div>
    </transition>

    <!-- 導航按鈕 -->
    <div class="nav-buttons">
      <button v-if="currentStep > 0" class="nav-btn nav-prev" @click="currentStep--">Back</button>
      <button class="nav-btn nav-next" @click="handleNext">
        {{ currentStep < steps.length - 1 ? 'Next' : 'Ready!' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['complete'])
const currentStep = ref(0)

const steps = [
  { id: 'equipment' },
  { id: 'assist' },
]

const equipment = [
  { step: 1, name: 'Disposable VR Face Cover' },
  { step: 2, name: 'Leg Tracker' },
  { step: 3, name: 'VR Headset' },
]

function handleNext() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  } else {
    emit('complete')
  }
}
</script>

<style scoped>
.tutorial-screen {
  position: fixed;
  inset: 0;
  z-index: 10;
}

/* ─── 步驟指示器 ─── */
.step-indicator {
  position: absolute;
  top: 28px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 60px;
  z-index: 20;
  pointer-events: auto;
  animation: fadeIn 0.6s ease both;
}

.step-dot {
  width: 40px; height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.25);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.4s ease;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  position: relative;
  z-index: 2;
}

.step-dot.active {
  border-color: #00e5a0;
  background: rgba(0, 229, 160, 0.2);
  box-shadow: 0 0 24px rgba(0, 229, 160, 0.35);
  transform: scale(1.1);
}

.step-dot.done { border-color: #00e5a0; background: #00e5a0; }
.step-dot.done .step-num { color: #0a1a12; }
.step-num { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.6); }
.step-dot.active .step-num { color: #00e5a0; }

.step-line {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 60px; height: 2px;
  background: rgba(255,255,255,0.15);
  border-radius: 1px;
  z-index: 1;
}

.step-line-fill {
  height: 100%;
  background: #00e5a0;
  border-radius: 1px;
  transition: width 0.4s ease;
}

/* ─── 對話卡片 ─── */
.tutorial-content {
  position: absolute;
  inset: 90px 0 90px 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-card {
  background: rgba(0, 10, 8, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 229, 160, 0.1);
  border-radius: 28px;
  padding: 36px 44px;
  max-width: 700px;
  width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: auto;
  box-shadow: 0 8px 40px rgba(0,0,0,0.4);
}

/* ─── 警告 ─── */
.alert-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 28px;
  width: 100%;
}

.alert-icon {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 50%;
  background: #f5a623; color: #000;
  font-size: 16px; font-weight: 900; flex-shrink: 0;
}

.alert-text {
  font-size: 16px; font-weight: 500;
  color: rgba(255,255,255,0.9);
  line-height: 1.6; margin: 0;
}

/* ─── 裝備列 ─── */
.equipment-row {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.equip-card { text-align: center; }

.step-tag {
  font-size: 14px; font-weight: 700;
  color: #f5c842; font-style: italic;
  display: block;
}

.equip-name {
  font-size: 12px; font-weight: 600;
  color: #f5c842; font-style: italic;
  display: block; margin-bottom: 6px;
}

.equip-image-box {
  width: 150px; height: 90px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  transition: border-color 0.3s ease;
}

.equip-image-box:hover { border-color: rgba(0,229,160,0.3); }
.equip-svg { width: 90px; height: 60px; }

/* ─── 協助人物 ─── */
.assist-figure {
  position: relative;
  margin: 8px auto 16px;
}

.figure-svg { filter: drop-shadow(0 4px 20px rgba(0,0,0,0.5)); }

.exclaim-badge {
  position: absolute;
  top: 5px; right: -12px;
  width: 32px; height: 32px;
  border-radius: 50%;
  background: #e24b4a;
  display: flex; align-items: center; justify-content: center;
  border: 3px solid #fff;
  animation: pulse-badge 2s ease-in-out infinite;
}

.exclaim-badge span { color: #fff; font-size: 18px; font-weight: 900; }

@keyframes pulse-badge { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }

.kick-prompt-box {
  background: #ffffff;
  color: #e24b4a;
  font-size: 16px; font-weight: 700; font-style: italic;
  padding: 12px 32px;
  border-radius: 50px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

/* ─── 導航按鈕 ─── */
.nav-buttons {
  position: absolute;
  bottom: 28px; left: 50%;
  transform: translateX(-50%);
  display: flex; gap: 16px; z-index: 20;
  pointer-events: auto;
  animation: fadeIn 0.6s ease 0.3s both;
}

.nav-btn {
  font-family: 'Outfit', sans-serif;
  font-size: 16px; font-weight: 700;
  padding: 14px 44px;
  border: none; border-radius: 50px;
  cursor: pointer; transition: all 0.25s ease; letter-spacing: 1px;
}

.nav-prev {
  background: rgba(255,255,255,0.1);
  color: #ccc;
  border: 1px solid rgba(255,255,255,0.15);
  backdrop-filter: blur(8px);
}
.nav-prev:hover { background: rgba(255,255,255,0.2); color: #fff; }

.nav-next {
  background: linear-gradient(135deg, #2a7a6a, #1a6a5a);
  color: #fff;
}
.nav-next:hover { transform: scale(1.04); box-shadow: 0 4px 20px rgba(0,229,160,0.2); }
.nav-next:active { transform: scale(0.97); }

/* ─── 過渡 ─── */
.slide-enter-active, .slide-leave-active { transition: all 0.4s ease; }
.slide-enter-from { opacity: 0; transform: translateX(30px); }
.slide-leave-to { opacity: 0; transform: translateX(-30px); }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
