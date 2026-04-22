<template>
  <div class="warmup-screen" @click="onScreenClick">
    <!-- 頂部提示列 -->
    <div class="hint-bar">
      <div class="hint-badge">
        <span class="hint-exclaim">!</span>
      </div>
      <p class="hint-text">
        Try to dodge the enemies — move quickly to left and right!<br>
        <span class="hint-sub">Do the move for 2 rounds.</span>
      </p>
    </div>

    <!-- 主要內容 -->
    <div class="warmup-content">
      <!-- 運動員 + 光環 -->
      <div class="athlete-area">
        <img :src="athleteImg" alt="athlete" class="athlete-img" />

        <!-- 倒計時光環 — 角色右下角 -->
        <div class="timer-ring">
          <img :src="circleImg" alt="" class="circle-img" :class="{ spinning: !completed }" />
          <div class="timer-center">
            <Transition name="pop" mode="out-in">
              <svg v-if="completed" key="check" class="check-icon" viewBox="0 0 80 80" width="80" height="80">
                <circle cx="40" cy="40" r="36" fill="rgba(0,229,160,0.15)"/>
                <circle cx="40" cy="40" r="28" fill="#00e5a0"/>
                <path class="check-path" d="M22 40 L34 52 L58 28" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </svg>
              <span v-else key="time" class="timer-number">{{ remaining }}</span>
            </Transition>
          </div>
        </div>
      </div>

    </div>

    <!-- 吉祥物過場 -->
    <Transition name="fade-in">
      <div v-if="phase === 'ready'" class="getready-overlay">
        <div class="getready-content">
          <img :src="mascotsImg" alt="mascots" class="mascots-img" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

import athleteImg from '../assets/images/4-user@4x.png'
import circleImg from '../assets/images/7-circle@4x.png'
import mascotsImg from '../assets/images/6-hint1@4x.png'

const emit = defineEmits(['complete'])

const phase = ref('dodge') // 'dodge' → 'ready'
const TOTAL_SECONDS = 5

const elapsed = ref(0)
const completed = ref(false)
const canProceed = ref(false)
let intervalId = null

function onScreenClick() {
  if (canProceed.value) goToReady()
}

let readyTimer = null

const remaining = computed(() => Math.max(0, TOTAL_SECONDS - elapsed.value))

function goToReady() {
  phase.value = 'ready'
  readyTimer = setTimeout(() => {
    emit('complete')
  }, 2500)
}

onMounted(() => {
  elapsed.value = 0
  completed.value = false

  intervalId = setInterval(() => {
    elapsed.value++
    if (elapsed.value >= TOTAL_SECONDS) {
      clearInterval(intervalId)
      intervalId = null
      completed.value = true
      setTimeout(() => {
        canProceed.value = true
      }, 800)
    }
  }, 1000)
})

onUnmounted(() => {
  if (intervalId) { clearInterval(intervalId); intervalId = null }
  if (readyTimer) { clearTimeout(readyTimer); readyTimer = null }
})
</script>

<style scoped>
.warmup-screen {
  position: fixed; inset: 0;
  z-index: 10;
  font-family: 'Outfit', sans-serif; color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

/* ─── 頂部提示列 ─── */
.hint-bar {
  z-index: 20;
  display: flex; align-items: center;
  gap: clamp(10px, 1.2vw, 20px);
  border-radius: clamp(10px, 1.2vw, 20px);
  padding: clamp(14px, 2vh, 28px) clamp(20px, 3vw, 44px);
  width: 90%;
  justify-content: center;
  margin-top: 8vh;
  margin-bottom: 2vh;
  animation: fadeSlideDown 0.6s ease both;
}

.hint-badge {
  width: clamp(28px, 3vw, 48px);
  height: clamp(28px, 3vw, 48px);
  border-radius: 50%;
  background: #f5b731;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.hint-exclaim {
  font-size: clamp(16px, 1.8vw, 26px);
  font-weight: 900; color: #1a1a1a; line-height: 1;
}

.hint-text {
  font-size: clamp(22px, 2.2vw, 34px);
  font-weight: 700; color: #fff;
  line-height: 1.5; margin: 0;
  text-align: center;
}

.hint-sub {
  font-size: clamp(16px, 1.6vw, 24px);
  font-weight: 700; font-style: italic;
  color: #f5a623;
}

/* ─── 主要內容 ─── */
.warmup-content {
  flex: 1;
  display: flex; flex-direction: column; align-items: center;
  justify-content: center;
  width: 90%; max-width: 600px;
  animation: fadeIn 0.6s ease both;
}

/* 運動員圖片 */
.athlete-area {
  position: relative;
}
.athlete-img {
  height: clamp(420px, 75vh, 700px); width: auto; object-fit: contain;
  filter: drop-shadow(0 8px 30px rgba(0,0,0,0.5));
}

/* 倒計時光環 — 角色右下角 */
.timer-ring {
  position: absolute;
  bottom: 5%; right: -35%;
  width: clamp(80px, 10vw, 140px);
  height: clamp(80px, 10vw, 140px);
  display: flex; align-items: center; justify-content: center;
}
.circle-img {
  width: 100%; height: 100%; object-fit: contain;
  filter: drop-shadow(0 0 2vw rgba(0,229,160,0.4));
}
.circle-img.spinning {
  animation: spin 4s linear infinite;
}
.timer-center {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  z-index: 2;
}
.timer-number {
  font-size: clamp(28px, 3.5vw, 48px); font-weight: 900;
  text-shadow: 0 2px 10px rgba(0,0,0,0.4);
}
.check-icon {
  width: 55%; height: 55%;
  filter: drop-shadow(0 0 1.5vw rgba(0,229,160,0.6));
}
.check-path {
  stroke-dasharray: 60;
  stroke-dashoffset: 60;
  animation: drawCheck 0.5s ease 0.2s forwards;
}


/* ─── 吉祥物過場 ─── */
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

.fade-in-enter-active { transition: opacity 0.5s ease; }
.fade-in-leave-active { transition: opacity 0.3s ease; }
.fade-in-enter-from, .fade-in-leave-to { opacity: 0; }

/* Transitions */
.pop-enter-active { animation: popIn 0.35s ease; }
.pop-leave-active { transition: opacity 0.15s; }
.pop-leave-to { opacity: 0; }

/* Keyframes */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes drawCheck { to { stroke-dashoffset: 0; } }
@keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
