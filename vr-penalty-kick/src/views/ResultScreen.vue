<template>
  <div class="result-screen">
    <!-- 彩片 -->
    <div class="confetti-container">
      <div v-for="i in 40" :key="i" class="confetti" :style="confettiStyle(i)"></div>
    </div>

    <!-- Phase 1: PERFECT VISION -->
    <Transition name="fade-page">
      <div v-if="phase === 'perfect'" class="center-area" key="perfect">
        <img :src="perfectImg" alt="Perfect Vision" class="perfect-img" />
      </div>
    </Transition>

    <!-- Phase 2: Experience Complete + 玩家 -->
    <Transition name="fade-page">
      <div v-if="showComplete" class="complete-area" key="complete">
        <div class="top-area">
          <img :src="hintImg" alt="Experience Complete" class="header-img" />
        </div>
        <div class="user-area">
          <img :src="userImg" alt="player" class="user-img" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/gameStore.js'

import perfectImg from '../assets/images/9-perfect@4x.png'
import hintImg from '../assets/images/9-hint@4x.png'
import userImg from '../assets/images/9-user@4x.png'

const store = useGameStore()

const phase = ref('perfect') // 'perfect' → 'complete'
const showComplete = ref(false)
let timer = null

const confettiColors = ['#f5c842', '#00e5a0', '#e24b4a', '#00b8d4', '#ff6b9d', '#a855f7', '#fff']

function confettiStyle(i) {
  const left = Math.random() * 100
  const delay = Math.random() * 3
  const duration = 3 + Math.random() * 4
  const size = 4 + Math.random() * 8
  const color = confettiColors[i % confettiColors.length]
  const rotate = Math.random() * 360
  return {
    left: `${left}%`,
    width: `${size}px`,
    height: `${size * (0.4 + Math.random() * 0.6)}px`,
    background: color,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    transform: `rotate(${rotate}deg)`,
  }
}

onMounted(() => {
  phase.value = 'perfect'
  showComplete.value = false
  timer = setTimeout(() => {
    phase.value = 'complete'
    // 等吉祥物淡出完成後再顯示球員
    setTimeout(() => {
      showComplete.value = true
    }, 600)
  }, 4000)
})

onUnmounted(() => {
  if (timer) { clearTimeout(timer); timer = null }
})
</script>

<style scoped>
.result-screen {
  position: fixed; inset: 0;
  z-index: 10;
  display: flex;
  align-items: center; justify-content: center;
  font-family: 'Outfit', sans-serif; color: #fff;
  overflow: hidden;
}

/* ─── 彩片 ─── */
.confetti-container {
  position: absolute; inset: 0;
  z-index: 5; pointer-events: none;
  overflow: hidden;
}
.confetti {
  position: absolute;
  top: -10%;
  border-radius: 2px;
  opacity: 0.9;
  animation: confetti-fall linear infinite;
}

/* ─── Phase 1: PERFECT VISION ─── */
.center-area {
  z-index: 10;
  animation: fadeIn 0.8s ease both;
}
.perfect-img {
  width: clamp(340px, 50vw, 700px);
  height: auto;
  filter: drop-shadow(0 8px 30px rgba(0,0,0,0.4));
  animation: trophy-float 3s ease-in-out infinite;
}

/* ─── Phase 2: Experience Complete ─── */
.complete-area {
  position: absolute; inset: 0;
  z-index: 10;
  display: flex; flex-direction: column;
  align-items: center;
}
.top-area {
  width: 100%;
  display: flex; justify-content: center;
  animation: fadeSlideDown 0.5s ease both;
}
.header-img {
  width: 80%;
  max-width: 700px;
  height: auto;
  margin-top: 11vh;
  filter: drop-shadow(0 0.4vh 1.5vw rgba(0,0,0,0.4));
}
.user-area {
  flex: 1;
  display: flex; align-items: flex-end; justify-content: center;
  animation: fadeSlideUp 0.6s ease 0.3s both;
}
.user-img {
  height: clamp(300px, 60vh, 600px);
  width: auto;
  filter: drop-shadow(0 8px 30px rgba(0,0,0,0.5));
}

/* ─── Transitions ─── */
.fade-page-enter-active { transition: opacity 0.5s ease; }
.fade-page-leave-active { transition: opacity 0.5s ease; }
.fade-page-enter-from, .fade-page-leave-to { opacity: 0; }

/* ─── Keyframes ─── */
@keyframes confetti-fall {
  0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0.3; }
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeSlideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes trophy-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
