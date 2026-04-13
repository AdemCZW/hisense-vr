<template>
  <div class="tutorial-screen">
    <!-- ════════ Page 1: 裝備佩戴 ════════ -->
    <transition name="slide" mode="out-in">
      <div v-if="currentStep === 0" key="equip" class="tutorial-content">
        <!-- 頂部提示文字 -->
        <div class="hint-bar">
          <div class="hint-badge">
            <span class="hint-exclaim">!</span>
          </div>
          <p class="hint-text">
            Before the game begins, please follow the staff's<br>
            instructions to put on the equipment.
          </p>
        </div>

        <!-- 裝備佈局 -->
        <div class="equip-layout">
          <!-- 左側裝備 -->
          <div class="equip-left">
            <div class="equip-item">
              <img src="../assets/images/2-step1@4x.png" alt="Step1" class="equip-img equip-img-1" />
            </div>
            <div class="equip-item">
              <img src="../assets/images/2-step2@4x.png" alt="Step2" class="equip-img equip-img-2" />
            </div>
          </div>

          <!-- 中央人物 -->
          <div class="equip-center">
            <img src="../assets/images/2-user@4x.png" alt="Player" class="user-img" />
            <svg class="connect-lines" viewBox="0 0 400 500" preserveAspectRatio="none">
              <line x1="60" y1="100" x2="160" y2="80" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-dasharray="6,4"/>
              <circle cx="160" cy="80" r="4" fill="#00e5a0"/>
              <line x1="80" y1="360" x2="170" y2="320" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-dasharray="6,4"/>
              <circle cx="170" cy="320" r="4" fill="#00e5a0"/>
              <line x1="340" y1="160" x2="240" y2="60" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-dasharray="6,4"/>
              <circle cx="240" cy="60" r="4" fill="#00e5a0"/>
            </svg>
          </div>

          <!-- 右側裝備 -->
          <div class="equip-right">
            <div class="equip-item">
              <img src="../assets/images/2-step3@4x.png" alt="Step3" class="equip-img equip-img-3" />
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ════════ Page 2: 體驗協助 ════════ -->
    <transition name="slide" mode="out-in">
      <div v-if="currentStep === 1" key="assist" class="tutorial-content">
        <div class="dialog-card">
          <div class="alert-banner">
            <div class="hint-badge hint-badge-sm">
              <span class="hint-exclaim">!</span>
            </div>
            <p class="alert-text">
              If you feel uncomfortable or have any questions,<br>
              please raise your hand and inform the staff.
            </p>
          </div>

          <div class="assist-figure">
            <svg viewBox="0 0 200 280" class="figure-svg">
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

/* ─── 教學內容區 ─── */
.tutorial-content {
  position: absolute;
  inset: 2vh 0 8vh 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

/* ─── 頂部提示列 ─── */
.hint-bar {
  display: flex;
  align-items: center;
  gap: clamp(10px, 1.2vw, 20px);
  background: rgba(20, 50, 40, 0.85);
  backdrop-filter: blur(12px);
  border-radius: clamp(10px, 1.2vw, 20px);
  padding: clamp(14px, 2vh, 28px) clamp(20px, 3vw, 44px);
  margin-top: 2vh;
  margin-bottom: 2vh;
  max-width: 60vw;
  width: 90%;
  animation: fadeSlideDown 0.6s ease both;
}

.hint-badge {
  width: clamp(28px, 3vw, 48px);
  height: clamp(28px, 3vw, 48px);
  border-radius: 50%;
  background: #f5b731;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hint-badge-sm {
  width: clamp(24px, 2.5vw, 38px);
  height: clamp(24px, 2.5vw, 38px);
}

.hint-exclaim {
  font-size: clamp(16px, 1.8vw, 26px);
  font-weight: 900;
  color: #1a1a1a;
  line-height: 1;
}

.hint-badge-sm .hint-exclaim {
  font-size: clamp(14px, 1.4vw, 22px);
}

.hint-text {
  font-size: clamp(14px, 1.4vw, 22px);
  font-weight: 700;
  color: #fff;
  line-height: 1.5;
  margin: 0;
}

/* ─── 裝備佈局（三欄） ─── */
.equip-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 90%;
  max-width: 75vw;
  flex: 1;
  position: relative;
  animation: fadeIn 0.8s ease 0.2s both;
}

.equip-left {
  display: flex;
  flex-direction: column;
  gap: 2vh;
  align-items: flex-end;
  flex: 0 0 20vw;
}

.equip-center {
  position: relative;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-img {
  height: clamp(250px, 55vh, 600px);
  width: auto;
  filter: drop-shadow(0 0.8vh 2.5vw rgba(0,0,0,0.5));
  position: relative;
  z-index: 2;
}

.connect-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.equip-right {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 0 0 20vw;
  padding-top: 3vh;
}

.equip-item {
  position: relative;
}

.equip-img {
  filter: drop-shadow(0 0.4vh 1.2vw rgba(0,0,0,0.4));
}

.equip-img-1 {
  width: clamp(140px, 16vw, 280px);
  height: auto;
}

.equip-img-2 {
  width: clamp(130px, 15vw, 270px);
  height: auto;
}

.equip-img-3 {
  width: clamp(140px, 16vw, 280px);
  height: auto;
}

/* ─── Page 2: 對話卡片 ─── */
.dialog-card {
  background: rgba(0, 10, 8, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 229, 160, 0.1);
  border-radius: clamp(16px, 2vw, 32px);
  padding: clamp(24px, 3vh, 44px) clamp(28px, 3.5vw, 52px);
  max-width: 50vw;
  width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: auto;
  box-shadow: 0 0.8vh 3vw rgba(0,0,0,0.4);
  margin-top: 5vh;
}

.alert-banner {
  display: flex;
  align-items: center;
  gap: clamp(8px, 1vw, 16px);
  margin-bottom: clamp(16px, 2vh, 28px);
  width: 100%;
}

.alert-text {
  font-size: clamp(13px, 1.2vw, 18px);
  font-weight: 500;
  color: rgba(255,255,255,0.9);
  line-height: 1.6;
  margin: 0;
}

.assist-figure {
  position: relative;
  margin: 1vh auto 2vh;
}

.figure-svg {
  width: clamp(100px, 12vw, 160px);
  height: auto;
  filter: drop-shadow(0 0.4vh 1.5vw rgba(0,0,0,0.5));
}

.exclaim-badge {
  position: absolute;
  top: 0.5vh;
  right: -1vw;
  width: clamp(24px, 2.5vw, 36px);
  height: clamp(24px, 2.5vw, 36px);
  border-radius: 50%;
  background: #e24b4a;
  display: flex; align-items: center; justify-content: center;
  border: 0.2vw solid #fff;
  animation: pulse-badge 2s ease-in-out infinite;
}

.exclaim-badge span {
  color: #fff;
  font-size: clamp(14px, 1.4vw, 20px);
  font-weight: 900;
}

@keyframes pulse-badge { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }

.kick-prompt-box {
  background: #ffffff;
  color: #e24b4a;
  font-size: clamp(13px, 1.2vw, 18px);
  font-weight: 700;
  font-style: italic;
  padding: clamp(8px, 1vh, 14px) clamp(20px, 2.5vw, 40px);
  border-radius: 5vw;
  box-shadow: 0 0.4vh 1.5vw rgba(0,0,0,0.3);
}

/* ─── 導航按鈕 ─── */
.nav-buttons {
  position: absolute;
  bottom: 3vh;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: clamp(10px, 1.2vw, 20px);
  z-index: 20;
  pointer-events: auto;
  animation: fadeIn 0.6s ease 0.3s both;
}

.nav-btn {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(14px, 1.3vw, 20px);
  font-weight: 700;
  padding: clamp(10px, 1.4vh, 18px) clamp(28px, 3.5vw, 56px);
  border: none;
  border-radius: 5vw;
  cursor: pointer;
  transition: all 0.25s ease;
  letter-spacing: 0.05em;
}

.nav-prev {
  background: rgba(255,255,255,0.1);
  color: #ccc;
  border: 1px solid rgba(255,255,255,0.15);
  backdrop-filter: blur(8px);
}
.nav-prev:hover { background: rgba(255,255,255,0.2); color: #fff; }

.nav-next {
  font-weight: 800;
  font-style: italic;
  color: #1a6a5a;
  background: #ffffff;
  box-shadow: 0 0.4vh 1.2vw rgba(0,0,0,0.25);
}
.nav-next:hover { transform: scale(1.04); box-shadow: 0 0.6vh 1.8vw rgba(0,0,0,0.3); }
.nav-next:active { transform: scale(0.97); }

/* ─── 過渡 ─── */
.slide-enter-active, .slide-leave-active { transition: all 0.4s ease; }
.slide-enter-from { opacity: 0; transform: translateX(2vw); }
.slide-leave-to { opacity: 0; transform: translateX(-2vw); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-2vh); } to { opacity: 1; transform: translateY(0); } }
</style>
