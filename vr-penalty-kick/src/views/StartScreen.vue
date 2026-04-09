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

    <!-- START 按鈕 -->
    <div class="start-btn-wrapper">
      <button class="start-btn" @click="$emit('start')">START</button>
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
  left: 28px;
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
  width: clamp(400px, 65vw, 800px);
  height: auto;
  filter: drop-shadow(0 4px 30px rgba(0,0,0,0.5));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* ─── START 按鈕 ─── */
.start-btn-wrapper {
  position: absolute;
  bottom: 60px;
  z-index: 20;
  pointer-events: auto;
}

.start-btn {
  font-family: 'Outfit', sans-serif;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 3px;
  color: #ffffff;
  background: linear-gradient(135deg, #2a7a6a, #1a6a5a);
  border: none;
  border-radius: 50px;
  padding: 18px 80px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.25s ease;
}

.start-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.4);
  background: linear-gradient(135deg, #338a78, #1e7a68);
}

.start-btn:active { transform: scale(0.97); }

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
