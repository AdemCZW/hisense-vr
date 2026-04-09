<template>
  <div class="result-screen">
    <!-- 獎章 -->
    <div class="medal-area">
      <div class="medal-glow" :class="store.medal"></div>
      <div class="medal-icon" :class="store.medal">
        <svg v-if="store.medal === 'gold'" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="#f5c842" stroke="#d4a017" stroke-width="3"/>
          <circle cx="60" cy="60" r="42" fill="none" stroke="#d4a017" stroke-width="1.5" stroke-dasharray="4,4"/>
          <text x="60" y="55" text-anchor="middle" font-size="20" font-weight="900" fill="#8a6914" font-family="Outfit">GOLD</text>
          <text x="60" y="78" text-anchor="middle" font-size="32" font-weight="900" fill="#8a6914" font-family="Outfit">★</text>
        </svg>
        <svg v-else-if="store.medal === 'silver'" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="#c0c0c0" stroke="#999" stroke-width="3"/>
          <circle cx="60" cy="60" r="42" fill="none" stroke="#999" stroke-width="1.5" stroke-dasharray="4,4"/>
          <text x="60" y="55" text-anchor="middle" font-size="18" font-weight="900" fill="#666" font-family="Outfit">SILVER</text>
          <text x="60" y="78" text-anchor="middle" font-size="32" font-weight="900" fill="#666" font-family="Outfit">★</text>
        </svg>
        <svg v-else-if="store.medal === 'bronze'" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="#cd7f32" stroke="#a5651e" stroke-width="3"/>
          <circle cx="60" cy="60" r="42" fill="none" stroke="#a5651e" stroke-width="1.5" stroke-dasharray="4,4"/>
          <text x="60" y="55" text-anchor="middle" font-size="16" font-weight="900" fill="#7a4c1a" font-family="Outfit">BRONZE</text>
          <text x="60" y="78" text-anchor="middle" font-size="32" font-weight="900" fill="#7a4c1a" font-family="Outfit">★</text>
        </svg>
        <svg v-else viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="#333" stroke="#555" stroke-width="3"/>
          <text x="60" y="65" text-anchor="middle" font-size="14" font-weight="700" fill="#888" font-family="Outfit">TRY AGAIN</text>
        </svg>
      </div>
    </div>

    <!-- 成績 -->
    <div class="score-area">
      <h1 class="score-title">{{ store.medalLabel }}</h1>
      <div class="score-detail">
        <span class="score-num">{{ store.score }}</span>
        <span class="score-slash">/</span>
        <span class="score-total">{{ store.maxRounds }}</span>
      </div>
    </div>

    <!-- 回合明細 -->
    <div class="round-summary">
      <div v-for="(result, i) in store.results" :key="i" class="round-item" :class="result">
        <span class="round-label">Round {{ i + 1 }}</span>
        <span class="round-result">{{ result === 'goal' ? 'GOAL' : 'MISS' }}</span>
      </div>
    </div>

    <!-- QR Code 預留 -->
    <div class="qr-area">
      <div class="qr-placeholder">
        <svg viewBox="0 0 80 80" width="80" height="80">
          <rect x="0" y="0" width="80" height="80" rx="8" fill="#222" stroke="#444" stroke-width="1"/>
          <rect x="10" y="10" width="24" height="24" rx="2" fill="#555"/>
          <rect x="46" y="10" width="24" height="24" rx="2" fill="#555"/>
          <rect x="10" y="46" width="24" height="24" rx="2" fill="#555"/>
          <rect x="46" y="46" width="24" height="24" rx="2" fill="#444"/>
        </svg>
        <p class="qr-text">Scan to download your highlight video</p>
      </div>
    </div>

    <!-- 操作按鈕 -->
    <div class="action-buttons">
      <button class="btn-primary" @click="handlePlayAgain">PLAY AGAIN</button>
      <button class="btn-secondary" @click="handleBackToStart">Back to Start</button>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '../stores/gameStore.js'

const store = useGameStore()

function handlePlayAgain() {
  store.startGame()
}

function handleBackToStart() {
  store.resetAll()
}
</script>

<style scoped>
.result-screen {
  position: fixed; inset: 0;
  z-index: 10; pointer-events: none;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  font-family: 'Outfit', sans-serif; color: #fff;
}

/* 獎章 */
.medal-area {
  position: relative; z-index: 10; margin-bottom: 16px;
}

.medal-glow {
  position: absolute; inset: -40px; border-radius: 50%;
  filter: blur(40px); opacity: 0.4;
}
.medal-glow.gold { background: #f5c842; }
.medal-glow.silver { background: #c0c0c0; }
.medal-glow.bronze { background: #cd7f32; }
.medal-glow.none { background: #555; }

.medal-icon {
  width: 120px; height: 120px;
  animation: medal-float 3s ease-in-out infinite;
}

@keyframes medal-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* 成績 */
.score-area { position: relative; z-index: 10; text-align: center; margin-bottom: 20px; }

.score-title {
  font-size: clamp(32px, 6vw, 56px); font-weight: 900; letter-spacing: 4px;
  background: linear-gradient(135deg, #00e5a0, #00b8d4);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  margin: 0 0 8px 0;
}

.score-detail { font-size: 48px; font-weight: 900; letter-spacing: -2px; }
.score-num { color: #fff; }
.score-slash { color: rgba(255,255,255,0.3); margin: 0 4px; }
.score-total { color: rgba(255,255,255,0.4); }

/* 回合明細 */
.round-summary { display: flex; gap: 16px; z-index: 10; margin-bottom: 24px; }

.round-item {
  padding: 8px 20px; border-radius: 12px;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.1); text-align: center;
}
.round-item.goal { border-color: rgba(245,200,66,0.4); background: rgba(245,200,66,0.12); }
.round-item.miss { border-color: rgba(226,75,74,0.4); background: rgba(226,75,74,0.12); }

.round-label {
  display: block; font-size: 11px; font-weight: 500;
  color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;
}
.round-result { font-size: 16px; font-weight: 700; }
.round-item.goal .round-result { color: #f5c842; }
.round-item.miss .round-result { color: #e24b4a; }

/* QR */
.qr-area { z-index: 10; margin-bottom: 16px; }
.qr-placeholder {
  display: flex; align-items: center; gap: 16px;
  padding: 16px 24px;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
  border: 1px dashed rgba(255,255,255,0.15); border-radius: 16px;
}
.qr-text { font-size: 13px; color: rgba(255,255,255,0.4); font-style: italic; margin: 0; }

/* 按鈕 */
.action-buttons {
  position: absolute; bottom: 30px; z-index: 20;
  display: flex; gap: 16px;
  pointer-events: auto;
}

.btn-primary {
  font-family: 'Outfit', sans-serif;
  font-size: 20px; font-weight: 900; letter-spacing: 3px;
  color: #0a1a12; background: #ffffff;
  border: none; border-radius: 50px;
  padding: 16px 60px; cursor: pointer;
  box-shadow: 0 4px 30px rgba(255,255,255,0.3); transition: all 0.25s;
}
.btn-primary:hover { transform: scale(1.05); box-shadow: 0 6px 40px rgba(255,255,255,0.4); }

.btn-secondary {
  font-family: 'Outfit', sans-serif;
  font-size: 16px; font-weight: 500;
  color: rgba(255,255,255,0.6);
  background: rgba(255,255,255,0.1); backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 50px; padding: 16px 36px;
  cursor: pointer; transition: all 0.2s;
}
.btn-secondary:hover { background: rgba(255,255,255,0.2); color: #fff; }
</style>
