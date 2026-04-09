<template>
  <div class="game-view">
    <!-- VR 鏡片遮罩 -->
    <div class="vr-lens-mask"></div>

    <!-- 準星 -->
    <div v-if="store.ballReady && !store.gameOver" class="crosshair">
      <svg viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill="none" stroke="#00e5a0" stroke-width="1.5" opacity="0.6"/>
        <circle cx="30" cy="30" r="3" fill="#00e5a0" opacity="0.9"/>
        <line x1="30" y1="4" x2="30" y2="14" stroke="#00e5a0" stroke-width="1.5" opacity="0.5"/>
        <line x1="30" y1="46" x2="30" y2="56" stroke="#00e5a0" stroke-width="1.5" opacity="0.5"/>
        <line x1="4" y1="30" x2="14" y2="30" stroke="#00e5a0" stroke-width="1.5" opacity="0.5"/>
        <line x1="46" y1="30" x2="56" y2="30" stroke="#00e5a0" stroke-width="1.5" opacity="0.5"/>
      </svg>
    </div>

    <!-- HUD -->
    <div class="hud-panel">
      <div class="hud-stat">
        <div class="hud-label">SCORE</div>
        <div class="hud-value" style="color: #00e5a0;">{{ store.score }}</div>
      </div>
      <div class="hud-divider"></div>
      <div class="hud-stat">
        <div class="hud-label">ROUND</div>
        <div class="hud-dots">
          <div
            v-for="(_, i) in store.maxRounds"
            :key="i"
            class="round-dot"
            :class="{
              active: store.round === i && !store.gameOver,
              scored: store.results[i] === 'goal',
              missed: store.results[i] === 'miss',
            }"
          ></div>
        </div>
      </div>
      <div class="hud-divider"></div>
      <div class="hud-stat">
        <div class="hud-label">SPEED</div>
        <div class="hud-value hud-speed" :class="{ show: store.lastKickSpeed > 0 }">
          {{ store.lastKickSpeed > 0 ? store.lastKickSpeed : '—' }}
          <span v-if="store.lastKickSpeed > 0" class="hud-unit">km/h</span>
        </div>
      </div>
    </div>

    <!-- 中央訊息 -->
    <Transition name="msg">
      <div v-if="messageText" class="message-overlay">
        <div class="message-text" :class="messageClass">{{ messageText }}</div>
      </div>
    </Transition>

    <!-- 底部提示 -->
    <div class="bottom-hint">
      <span class="hint-text">{{ hintText }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted, computed } from 'vue'
import { useGameStore } from '../stores/gameStore.js'
import { GameManager } from '../game/GameManager.js'

const store = useGameStore()
const sceneApi = inject('scene3d')

const messageText = ref('')
const messageType = ref('')

const messageClass = computed(() => {
  if (messageType.value === 'goal') return 'goal-text'
  if (messageType.value === 'miss') return 'miss-text'
  if (messageType.value === 'ready') return 'ready-text'
  return ''
})

const hintText = computed(() => {
  if (!gameManager) return ''
  if (!gameManager.input.isPointerLocked) return 'Click to lock mouse → simulate VR head rotation'
  return 'Move mouse to look | Click to kick | ESC to unlock'
})

let gameManager = null

onMounted(() => {
  if (!sceneApi) return

  gameManager = new GameManager(sceneApi, store)

  gameManager.onMessage((text, type) => {
    messageText.value = text
    messageType.value = type
  })

  gameManager.onGameEnd(() => {
    setTimeout(() => {
      store.showResult()
    }, 1500)
  })

  gameManager.start()
})

onUnmounted(() => {
  if (gameManager) {
    gameManager.stop()
    gameManager.dispose()
    gameManager = null
  }
})
</script>

<style scoped>
.game-view {
  position: fixed;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}

/* VR 鏡片遮罩 */
.vr-lens-mask {
  position: fixed;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  background: radial-gradient(
    ellipse 85% 90% at center,
    transparent 60%,
    rgba(0, 0, 0, 0.6) 80%,
    rgba(0, 0, 0, 0.95) 100%
  );
}

/* 準星 */
.crosshair {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  z-index: 10;
  pointer-events: none;
}

.crosshair svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 8px rgba(0, 229, 160, 0.6));
}

/* HUD */
.hud-panel {
  position: fixed;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 32px;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 14px 36px;
  z-index: 10;
  pointer-events: none;
}

.hud-stat { text-align: center; }

.hud-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 4px;
}

.hud-value {
  font-size: 32px;
  font-weight: 900;
  letter-spacing: -1px;
  color: #fff;
}

.hud-speed {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.4);
  transition: all 0.3s;
}

.hud-speed.show { color: #00e5a0; }

.hud-unit {
  font-size: 12px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.4);
  margin-left: 2px;
}

.hud-divider {
  width: 1px;
  height: 36px;
  background: rgba(255, 255, 255, 0.15);
}

.hud-dots {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 4px;
}

.round-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.25);
  transition: all 0.3s ease;
}

.round-dot.active {
  background: #00e5a0;
  border-color: #00e5a0;
  box-shadow: 0 0 12px rgba(0, 229, 160, 0.5);
}

.round-dot.scored { background: #f5c842; border-color: #f5c842; }
.round-dot.missed { background: #e24b4a; border-color: #e24b4a; }

/* 中央訊息 */
.message-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  pointer-events: none;
}

.message-text {
  font-size: clamp(36px, 8vw, 72px);
  font-weight: 900;
  letter-spacing: -2px;
  text-shadow: 0 0 60px rgba(0, 229, 160, 0.4);
}

.goal-text { color: #f5c842; }
.miss-text { color: #e24b4a; }
.ready-text { color: #00e5a0; }

.msg-enter-active, .msg-leave-active { transition: all 0.3s ease; }
.msg-enter-from { opacity: 0; transform: scale(0.8); }
.msg-leave-to { opacity: 0; transform: scale(1.1); }

/* 底部提示 */
.bottom-hint {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  pointer-events: none;
}

.hint-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 300;
}
</style>
