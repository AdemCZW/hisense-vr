<template>
  <div ref="gameViewRef" class="game-view" @mousemove="onMouseMove" @click="onClick">

    <!-- 上方計分板 -->
    <div class="scoreboard">
        <img :src="scoreImg" alt="Penalty Kick" class="score-bg" />
        <!-- 時間顯示 -->
        <div class="timer-display">{{ timerText }}</div>
        <!-- Shot 數字 -->
        <div class="shot-count">{{ store.round }}</div>
        <!-- 三顆球計分 -->
        <div class="score-balls">
          <div
            v-for="(_, i) in store.maxRounds"
            :key="i"
            class="ball-slot"
            :class="{ played: i < store.round }"
          >
            <img :src="i < store.round ? glowBalls[i] : footballNormal" alt="" class="ball-icon" />
          </div>
        </div>
      </div>

      <!-- 中央訊息 -->
      <Transition name="msg">
        <div v-if="centerMsg" :key="centerMsg.id" class="message-overlay">
          <img v-if="centerMsg.type === 'kick'" :src="kickImg" alt="KICK!" class="kick-prompt-img" />
          <div v-else class="message-text" :class="centerMsg.type">{{ centerMsg.text }}</div>
        </div>
      </Transition>

      <!-- 足球 -->
      <div class="football-wrapper" ref="footballRef">
        <img
          v-if="store.ballReady"
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

    <!-- FINISH 畫面 -->
    <Transition name="fade-overlay">
      <div v-if="showFinish" class="finish-overlay">
        <img :src="finishImg" alt="FINISH!" class="finish-img" />
      </div>
    </Transition>

    <!-- 進球慶祝：光暈 + 吉祥物 -->
    <Transition name="celebration">
      <div v-if="showGoalCelebration" class="goal-celebration">
        <img :src="glowBgImg" alt="" class="glow-bg" />
        <img :src="currentGoalImg" alt="GOAL!" class="goal-mascot" />
      </div>
    </Transition>

    <!-- How to Play 說明（覆蓋在遊戲畫面上） -->
    <Transition name="fade-overlay">
      <div v-if="phase === 'howto'" class="howto-overlay">
        <img :src="howtoImg" alt="How to Play" class="howto-img" />
        <p class="howto-tap">Tap anywhere to start</p>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, inject, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/gameStore.js'
import { GameManager } from '../game/GameManager.js'

import howtoImg from '../assets/images/8-howtoplay@4x.png'
import scoreImg from '../assets/images/8-score@4x.png'
import kickImg from '../assets/images/8-kick@4x.png'
import footballNormal from '../assets/images/8-足球@4x.png'
import footballGlow from '../assets/images/7-football@4x.png'
import ballGlowG from '../assets/images/8-足球G@4x.png'
import ballGlowB from '../assets/images/8-足球B@4x.png'
import ballGlowR from '../assets/images/8-足球R@4x.png'
import footLeftImg from '../assets/images/7-左腳@4x.png'
import footRightImg from '../assets/images/7-右腳@4x.png'
import goalImg1 from '../assets/images/8-goal1@4x.png'
import goalImg2 from '../assets/images/8-goal2@4x.png'
import goalImg3 from '../assets/images/8-goal3@4x.png'
import glowBgImg from '../assets/images/8-光暈@4x.png'
import finishImg from '../assets/images/9-finish@4x.png'

const store = useGameStore()
const sceneApi = inject('scene3d')
let gameManager = null

// 三局發光球：綠 → 藍 → 紅
const glowBalls = [ballGlowG, ballGlowB, ballGlowR]
// 三局進球吉祥物
const goalMascots = [goalImg1, goalImg2, goalImg3]

// ─── 進球慶祝 ───
const showGoalCelebration = ref(false)
const currentGoalImg = ref(null)
const showFinish = ref(false)

// ─── 階段控制 ───
const phase = ref('howto') // 'howto' → 'playing'

// ─── 倒計時（3:30） ───
const TOTAL_TIME = 3 * 60 + 30 // 210 秒
const timeLeft = ref(TOTAL_TIME)
let timerInterval = null

const timerText = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
  const s = timeLeft.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      clearInterval(timerInterval)
      timerInterval = null
      // 時間到，結束遊戲
      store.gameOver = true
      goToFinish()
    }
  }, 1000)
}

// ─── 中央訊息 ───
const centerMsg = ref(null)
let msgId = 0

function showMsg(text, type, duration = 1500) {
  const id = ++msgId
  centerMsg.value = { id, text, type }
  if (duration > 0) {
    setTimeout(() => { if (centerMsg.value?.id === id) centerMsg.value = null }, duration)
  }
}

// ─── 腳部控制 ───
const footNearBall = ref(false)
const footballRef = ref(null)
const gameViewRef = ref(null)
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
    if (!store.isXR || phase.value !== 'playing') return
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
  if (phase.value !== 'playing') return

  const rect = gameViewRef.value?.getBoundingClientRect()
  if (!rect) return

  footPos.x = e.clientX - rect.left
  footPos.y = e.clientY - rect.top

  rightFootStyle.value = {
    left: `${footPos.x}px`,
    top: `${footPos.y}px`,
  }

  if (footballRef.value && store.ballReady) {
    const ballRect = footballRef.value.getBoundingClientRect()
    const cx = ballRect.left + ballRect.width / 2 - rect.left
    const cy = ballRect.top + ballRect.height / 2 - rect.top
    const dist = Math.sqrt((footPos.x - cx) ** 2 + (footPos.y - cy) ** 2)
    footNearBall.value = dist < ballRect.width * 0.8
  } else {
    footNearBall.value = false
  }
}

function goToFinish() {
  showFinish.value = true
  setTimeout(() => { store.showResult() }, 2500)
}

// ─── 點擊處理 ───
function onClick() {
  if (phase.value === 'howto') {
    // 進入遊戲
    phase.value = 'playing'
    startTimer()
    showMsg('', 'kick', 1500)
    return
  }

  // 踢球
  if (!footNearBall.value || !store.ballReady || store.gameOver) return

  const speed = 18 + Math.random() * 8
  const kmh = Math.round(speed * 3.6)

  // 每回合不同角度和顏色
  const round = store.round // 0, 1, 2
  let targetX, targetY, trailTheme

  if (round === 0) {
    // 第 1 球：綠色，右上角
    targetX = 1.5 + Math.random() * 1.2
    targetY = 1.5 + Math.random() * 0.7
    trailTheme = 'green'
  } else if (round === 1) {
    // 第 2 球：藍色，對角線從右下飛左上角
    targetX = -1.5 - Math.random() * 1.2
    targetY = 1.6 + Math.random() * 0.6
    trailTheme = 'blue'
  } else {
    // 第 3 球：紅色，中間偏隨機
    targetX = (Math.random() - 0.5) * 4
    targetY = 0.8 + Math.random() * 1.2
    trailTheme = 'red'
  }

  footNearBall.value = false
  store.kick(kmh, 0)

  // 觸發 3D 物理踢球 + 軌跡（由物理引擎判定進球）
  if (gameManager) {
    gameManager._resultChecked = false
    gameManager.ballTrail.setTheme(trailTheme)
    gameManager.physics.kickBall({ targetX, targetY, speed })
    gameManager.ballTrail.start()
    gameManager.goalkeeper.triggerDive(store.round, targetX)
  }
}

// ─── 生命週期 ───
onMounted(() => {
  phase.value = 'howto'
  timeLeft.value = TOTAL_TIME

  // 初始化 3D 遊戲管理器（等場景準備好）
  function tryInitGameManager() {
    if (!sceneApi || !sceneApi.getScene()) {
      // 場景尚未準備好，稍後重試
      setTimeout(tryInitGameManager, 100)
      return
    }
    try {
      gameManager = new GameManager(sceneApi, store)

      // 物理判定結果回調（取代隨機判定）
      gameManager.onResult((result) => {
        store.recordResult(result)

        if (result === 'goal') {
          currentGoalImg.value = goalMascots[store.round - 1] || goalMascots[0]
          showGoalCelebration.value = true
          setTimeout(() => {
            showGoalCelebration.value = false
            if (gameManager) gameManager.ballTrail.fadeOut(600)
            setTimeout(() => {
              if (gameManager) {
                gameManager.ballTrail.reset()
                gameManager.physics.resetBall()
                gameManager.football.reset()
                gameManager.goalkeeper.reset()
              }
              if (store.hasNextRound) {
                store.readyNextRound()
                showMsg('', 'kick', 1500)
              } else {
                goToFinish()
              }
            }, 700)
          }, 2500)
        } else {
          showMsg('MISS!', 'miss-text')
          if (gameManager) gameManager.ballTrail.fadeOut(600)
          setTimeout(() => {
            if (gameManager) {
              gameManager.ballTrail.reset()
              gameManager.physics.resetBall()
              gameManager.football.reset()
              gameManager.goalkeeper.reset()
            }
            if (store.hasNextRound) {
              store.readyNextRound()
              showMsg('', 'kick', 1500)
            } else {
              goToFinish()
            }
          }, 1500)
        }
      })

      gameManager.start()
    } catch (e) {
      console.error('[GameView] GameManager init failed:', e)
      gameManager = null
    }
  }
  tryInitGameManager()
})

onUnmounted(() => {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
  if (gameManager) { gameManager.dispose(); gameManager = null }
})
</script>

<style scoped>
.game-view {
  position: fixed; inset: 0;
  z-index: 10;
  cursor: none;
  font-family: 'Outfit', sans-serif; color: #fff;
}

/* ─── How to Play 說明 ─── */
.howto-overlay {
  position: absolute; inset: 0;
  z-index: 40;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 30px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  cursor: pointer;
}
.howto-img {
  width: clamp(400px, 55vw, 800px); height: auto;
  filter: drop-shadow(0 8px 40px rgba(0,0,0,0.5));
  animation: popIn 0.5s ease both;
}
.howto-tap {
  font-size: clamp(14px, 1.5vw, 20px);
  font-weight: 600; font-style: italic;
  color: rgba(255,255,255,0.6);
  animation: subtle-blink 2s ease-in-out infinite;
}

.fade-overlay-enter-active { transition: opacity 0.4s; }
.fade-overlay-leave-active { transition: opacity 0.4s; }
.fade-overlay-enter-from, .fade-overlay-leave-to { opacity: 0; }

/* ─── 計分板 ─── */
.scoreboard {
  position: absolute;
  top: 2vh;
  left: 50%; transform: translateX(-50%);
  z-index: 20; pointer-events: none;
  width: 22vw; min-width: 200px; max-width: 340px;
  font-size: max(12px, min(1.8vw, 22px));
}
.score-bg {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 4px 20px rgba(0,0,0,0.6));
}

/* 時間顯示 — 相對計分板等比 */
.timer-display {
  position: absolute;
  top: 13%;
  left: 50%; transform: translateX(-50%);
  font-size: 1.2em;
  font-weight: 900; color: #fff;
  letter-spacing: 0.1em;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  white-space: nowrap;
}

/* Shot 文字+數字 */
.shot-count {
  position: absolute;
  bottom: 34%;
  left: 8%;
  font-size: 1.1em;
  font-weight: 900; color: #fff;
}

/* 三顆球計分 */
.score-balls {
  position: absolute;
  bottom: 8%;
  left: 50%; transform: translateX(-50%);
  display: flex; gap: 2%;
  align-items: flex-end;
  width: 70%;
}
.ball-slot {
  flex: 1;
  transition: opacity 0.4s ease, filter 0.4s ease, transform 0.4s ease;
}
.ball-slot:not(.played) {
  opacity: 0.3;
  filter: grayscale(0.5);
}
.ball-slot.played {
  transform: scale(2.1);
}
.ball-icon {
  width: 100%; height: 100%; object-fit: contain;
}

/* ─── 中央訊息 ─── */
.message-overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  z-index: 30; pointer-events: none;
}
.kick-prompt-img {
  width: clamp(320px, 40vw, 600px); height: auto;
  filter: drop-shadow(0 4px 30px rgba(0,0,0,0.5));
  animation: popIn 0.4s ease both;
}
.message-text {
  font-size: clamp(40px, 8vw, 80px);
  font-weight: 900; letter-spacing: -2px;
}
.goal-text { color: #f5c842; text-shadow: 0 0 40px rgba(245,200,66,0.5); }
.miss-text { color: #e24b4a; text-shadow: 0 0 40px rgba(226,75,74,0.5); }

.msg-enter-active { animation: popIn 0.3s ease; }
.msg-leave-active { transition: opacity 0.25s; }
.msg-leave-to { opacity: 0; }

/* ─── 足球 ─── */
.football-wrapper {
  position: absolute;
  bottom: 15%; left: 50%; transform: translateX(-50%);
  width: clamp(100px, 12vw, 180px);
  height: clamp(100px, 12vw, 180px);
  z-index: 10; pointer-events: none;
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

/* ─── 鞋子 ─── */
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
.foot-static-left {
  bottom: -22%; left: 36%; transform: translateX(-50%);
}
.foot-follow {
  transform: translate(-50%, -50%);
}

/* ─── FINISH 畫面 ─── */
.finish-overlay {
  position: absolute; inset: 0;
  z-index: 40;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  pointer-events: none;
}
.finish-img {
  width: clamp(320px, 40vw, 600px); height: auto;
  filter: drop-shadow(0 4px 30px rgba(0,0,0,0.5));
  animation: popIn 0.5s ease both;
}

/* ─── 進球慶祝 ─── */
.goal-celebration {
  position: absolute; inset: 0;
  z-index: 35;
  pointer-events: none;
  overflow: hidden;
}
.glow-bg {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  opacity: 0.7;
  animation: glow-pulse 1.5s ease-in-out infinite;
}
.goal-mascot {
  position: absolute;
  bottom: -12%;
  left: 50%; transform: translateX(-50%);
  width: clamp(400px, 55vw, 800px); height: auto;
  filter: drop-shadow(0 8px 30px rgba(0,0,0,0.4));
  animation: mascot-enter 0.5s ease both, mascot-shake 0.4s ease 0.5s 3;
}

.celebration-enter-active { transition: opacity 0.3s; }
.celebration-leave-active { transition: opacity 0.5s; }
.celebration-enter-from, .celebration-leave-to { opacity: 0; }

@keyframes glow-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}
@keyframes mascot-enter {
  from { transform: translateX(-50%) scale(0.3) translateY(50px); opacity: 0; }
  to { transform: translateX(-50%) scale(1) translateY(0); opacity: 1; }
}
@keyframes mascot-shake {
  0%, 100% { transform: translateX(-50%) rotate(0deg); }
  25% { transform: translateX(-50%) rotate(-3deg); }
  75% { transform: translateX(-50%) rotate(3deg); }
}

/* ─── Keyframes ─── */
@keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes subtle-blink { 0%,100% { opacity: 0.7; } 50% { opacity: 0.3; } }
@keyframes ball-glow-pulse {
  0%, 100% { filter: drop-shadow(0 0 30px rgba(245,200,66,0.6)) drop-shadow(0 0 60px rgba(245,200,66,0.3)); }
  50% { filter: drop-shadow(0 0 40px rgba(245,200,66,0.8)) drop-shadow(0 0 70px rgba(245,200,66,0.5)); }
}
</style>
