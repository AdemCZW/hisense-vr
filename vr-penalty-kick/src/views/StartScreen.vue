<template>
  <div class="start-screen">
    <!-- 左上角 FIFA Logo -->
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
        v-for="n in 15"
        :key="n"
        class="particle"
        :style="particleStyle()"
      ></div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['start'])

function particleStyle() {
  const size = 0.2 + Math.random() * 0.3 // vw
  return {
    width: `${size}vw`,
    height: `${size}vw`,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 8}s`,
    animationDuration: `${6 + Math.random() * 8}s`,
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

/* ─── Logo ─── */
.top-branding {
  position: absolute;
  top: 2.5vh;
  left: 2vw;
  z-index: 10;
  animation: fadeSlideDown 0.8s ease both;
}

.logo-img {
  height: clamp(50px, 6vh, 90px);
  width: auto;
  filter: drop-shadow(0 0.3vh 1.2vw rgba(0,0,0,0.6));
}

/* ─── 中央標語 ─── */
.center-content {
  position: relative;
  z-index: 10;
  text-align: center;
  animation: fadeSlideUp 1s ease 0.2s both;
}

.slogan-img {
  width: clamp(280px, 55vw, 850px);
  height: auto;
  filter: drop-shadow(0 0.5vh 3vw rgba(0,0,0,0.6));
}

/* ─── START 按鈕 ─── */
.start-btn-wrapper {
  position: absolute;
  bottom: 6vh;
  z-index: 20;
  pointer-events: auto;
  animation: fadeSlideUp 0.8s ease 0.6s both;
}

.start-btn {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(18px, 2vw, 32px);
  font-weight: 800;
  font-style: italic;
  letter-spacing: 0.2em;
  color: #1a6a5a;
  background: #ffffff;
  border: none;
  border-radius: 5vw;
  padding: 1.8vh 6vw;
  cursor: pointer;
  box-shadow: 0 0.4vh 2vw rgba(0,0,0,0.25);
  transition: all 0.25s ease;
}

.start-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0.6vh 2.5vw rgba(0,0,0,0.35);
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
  bottom: -1vh;
  background: rgba(0, 229, 160, 0.4);
  border-radius: 50%;
  animation: rise linear infinite;
}

/* ─── 動畫 ─── */
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(3vh); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeSlideDown {
  from { opacity: 0; transform: translateY(-2vh); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes rise {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  10% { opacity: 0.3; }
  90% { opacity: 0.05; }
  100% { transform: translateY(-100vh) scale(0.2); opacity: 0; }
}
</style>
