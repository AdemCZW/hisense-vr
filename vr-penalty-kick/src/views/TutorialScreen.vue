<template>
  <div class="tutorial-screen" @click="onPageClick">
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

        <!-- 裝備佈局（absolute 定位，方便微調） -->
        <div class="equip-layout">
          <!-- 中央人物 -->
          <img src="../assets/images/2-user@4x.png" alt="Player" class="user-img" />

          <!-- Step1: 左上 — 調 top/left 微調位置 -->
          <img src="../assets/images/2-step1@4x.png" alt="Step1" class="equip-abs equip-s1" />

          <!-- Step2: 左下 — 調 top/left 微調位置 -->
          <img src="../assets/images/2-step2@4x.png" alt="Step2" class="equip-abs equip-s2" />

          <!-- Step3: 右側 — 調 top/left 微調位置 -->
          <img src="../assets/images/2-step3@4x.png" alt="Step3" class="equip-abs equip-s3" />

        </div>
      </div>
    </transition>

    <!-- ════════ Page 2: 體驗協助 ════════ -->
    <transition name="slide" mode="out-in">
      <div v-if="currentStep === 1" key="assist" class="tutorial-content assist-page">
        <!-- 頂部提示文字 -->
        <div class="hint-bar">
          <div class="hint-badge">
            <span class="hint-exclaim">!</span>
          </div>
          <p class="hint-text">
            If you feel uncomfortable or have any questions,<br>
            please raise your hand and inform the staff.
          </p>
        </div>

        <!-- 人物圖（含紅色驚嘆號 + 底部文字） -->
        <div class="assist-center">
          <img src="../assets/images/5-user@4x.png" alt="Raise hand" class="assist-img" />
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['complete'])
const currentStep = ref(0)

function onPageClick() {
  if (currentStep.value === 0) {
    currentStep.value = 1
  } else if (currentStep.value === 1) {
    emit('complete')
  }
}

onMounted(() => {
  currentStep.value = 0
})

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
  backdrop-filter: blur(12px);
  border-radius: clamp(10px, 1.2vw, 20px);
  padding: clamp(14px, 2vh, 28px) clamp(20px, 3vw, 44px);
  margin-top: 8vh;
  margin-bottom: 2vh;
  width: 90%;
  justify-content: center;
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
  font-size: clamp(22px, 2.2vw, 34px);
  font-weight: 700;
  color: #fff;
  line-height: 1.5;
  margin: 0;
  text-align: center;
}

/* ─── 裝備佈局（固定比例容器） ─── */
.equip-layout {
  position: relative;
  width: min(95vw, 160vh);  /* 寬度跟隨視窗，但不會超過高度比例 */
  aspect-ratio: 16 / 9;     /* 固定寬高比，所有子元素等比縮放 */
  margin: -8vh auto 0;
  animation: fadeIn 0.8s ease 0.2s both;
}

/* 中央人物 — 所有尺寸用 % 相對容器 */
.user-img {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  height: 90%;
  width: auto;
  filter: drop-shadow(0 1% 3% rgba(0,0,0,0.5));
  z-index: 2;
}

/* 裝備圖共用 */
.equip-abs {
  position: absolute;
  z-index: 3;
  filter: drop-shadow(0 0.5% 1.5% rgba(0,0,0,0.4));
}

/* ── Step1: 左上 ── */
.equip-s1 {
  width: 22%;
  top: 16%;
  left: 28%;
}

/* ── Step2: 左下 ── */
.equip-s2 {
  width: 21%;
  top: 53%;
  left: 33%;
}

/* ── Step3: 右側 ── */
.equip-s3 {
  width: 22%;
  top: 17%;
  right: 26%;
}


/* ─── Page 2: 協助頁 ─── */
.assist-page {
  justify-content: flex-start;
}

.assist-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.assist-img {
  height: clamp(280px, 65vh, 650px);
  width: auto;
  filter: drop-shadow(0 0.8vh 2.5vw rgba(0,0,0,0.5));
}


/* ─── 過渡 ─── */
.slide-enter-active, .slide-leave-active { transition: all 0.4s ease; }
.slide-enter-from { opacity: 0; transform: translateX(2vw); }
.slide-leave-to { opacity: 0; transform: translateX(-2vw); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-2vh); } to { opacity: 1; transform: translateY(0); } }
</style>
