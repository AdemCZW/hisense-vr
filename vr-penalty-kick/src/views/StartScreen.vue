<template>
  <div class="start-screen">
    <!-- 右上角 FIFA Logo -->
    <div class="top-branding">
      <img src="../assets/images/1-logo@4x.png" alt="FIFA World Cup" class="logo-img" />
    </div>

    <!-- 中央標語圖片 -->
    <div class="center-content">
      <img src="../assets/images/1-slogan@4x.png" alt="VR Penalty Kick" class="slogan-img" />
    </div>

    <!-- Hisense 廣告圍欄 -->
    <div class="ad-board">
      <div class="ad-board-scroll">
        <span v-for="n in 12" :key="n" class="ad-item">
          <span class="ad-hisense">Hisense</span>
          <svg class="ad-fifa-icon" width="20" height="22" viewBox="0 0 32 36" fill="none">
            <path d="M16 2L28 8V20C28 28 16 34 16 34S4 28 4 20V8L16 2Z" fill="#C8A84E"/>
          </svg>
        </span>
      </div>
    </div>

    <!-- START 按鈕 -->
    <div class="start-btn-wrapper">
      <button class="start-btn" @click="$emit('start')">
        <span class="start-btn-text">START</span>
      </button>
    </div>

    <!-- 粒子動畫 -->
    <div class="particles">
      <div
        v-for="n in 20"
        :key="n"
        class="particle"
        :style="particleStyle(n)"
      ></div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['start'])

function particleStyle(n) {
  const size = 2 + Math.random() * 4
  const x = Math.random() * 100
  const delay = Math.random() * 8
  const duration = 6 + Math.random() * 8
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    opacity: 0.2 + Math.random() * 0.4,
  }
}
</script>

<style scoped>
.start-screen {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* ─── 右上角 Logo ─── */
.top-branding {
  position: absolute;
  top: 24px;
  right: 28px;
  z-index: 10;
}

.logo-img {
  height: 80px;
  width: auto;
  filter: drop-shadow(0 2px 12px rgba(0,0,0,0.5));
}

/* ─── 中央標語圖片 ─── */
.center-content {
  position: relative;
  z-index: 10;
  text-align: center;
  margin-top: -40px;
}

.slogan-img {
  width: clamp(300px, 50vw, 600px);
  height: auto;
  filter: drop-shadow(0 4px 30px rgba(0,0,0,0.5));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* ─── 廣告圍欄 ─── */
.ad-board {
  position: absolute;
  bottom: 140px;
  left: 0;
  right: 0;
  height: 48px;
  overflow: hidden;
  z-index: 5;
  background: linear-gradient(90deg, rgba(0,139,139,0.85), rgba(0,154,138,0.85), rgba(0,168,138,0.85), rgba(0,154,138,0.85), rgba(0,139,139,0.85));
  border-top: 2px solid rgba(0, 229, 160, 0.3);
  border-bottom: 2px solid rgba(0, 229, 160, 0.3);
}

.ad-board-scroll {
  display: flex;
  align-items: center;
  height: 100%;
  animation: scrollAd 20s linear infinite;
  white-space: nowrap;
}

@keyframes scrollAd {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.ad-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 32px;
}

.ad-hisense {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 1px;
}

.ad-fifa-icon { opacity: 0.8; }

/* ─── START 按鈕 ─── */
.start-btn-wrapper {
  position: absolute;
  bottom: 50px;
  z-index: 20;
  pointer-events: auto;
}

.start-btn {
  font-family: 'Outfit', sans-serif;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 4px;
  color: #0a1a12;
  background: #ffffff;
  border: none;
  border-radius: 60px;
  padding: 18px 80px;
  cursor: pointer;
  box-shadow: 0 4px 30px rgba(255, 255, 255, 0.3), 0 0 60px rgba(0, 229, 160, 0.2);
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.start-btn::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 62px;
  background: linear-gradient(135deg, #00e5a0, #00b8d4, #ffffff, #00e5a0);
  z-index: -1;
  animation: shimmer 3s linear infinite;
  background-size: 300% 300%;
}

@keyframes shimmer {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.start-btn:hover {
  transform: scale(1.06);
  box-shadow: 0 6px 40px rgba(255, 255, 255, 0.4), 0 0 80px rgba(0, 229, 160, 0.3);
}

.start-btn:active { transform: scale(0.98); }
.start-btn-text { position: relative; z-index: 1; }

/* ─── 粒子 ─── */
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
}

.particle {
  position: absolute;
  bottom: -10px;
  background: rgba(0, 229, 160, 0.6);
  border-radius: 50%;
  animation: rise linear infinite;
}

@keyframes rise {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  10% { opacity: 0.4; }
  90% { opacity: 0.1; }
  100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
}
</style>
