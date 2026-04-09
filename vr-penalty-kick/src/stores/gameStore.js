/**
 * gameStore.js — Pinia 遊戲狀態管理
 * 管理回合、分數、獎章、畫面切換等全域狀態
 */
import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    // 畫面流程
    screen: 'start', // start | tutorial | calibView | calibKick | game | result

    // 遊戲狀態
    round: 0,
    maxRounds: 3,
    score: 0,
    results: [],       // ['goal', 'miss', 'goal'] 每回合結果
    ballReady: true,
    ballKicked: false,
    gameStarted: false,
    gameOver: false,

    // 踢球數據
    lastKickSpeed: 0,  // km/h
    lastKickAngle: 0,  // degrees

    // 三回合 AI 難度
    difficultyLevels: [
      { reactionMs: 350, accuracy: 0.4, diveRange: 1.8 },
      { reactionMs: 250, accuracy: 0.55, diveRange: 2.2 },
      { reactionMs: 150, accuracy: 0.7, diveRange: 2.8 },
    ],
  }),

  getters: {
    /** 當前回合難度 */
    currentDifficulty(state) {
      return state.difficultyLevels[Math.min(state.round, 2)]
    },

    /** 獎章等級 */
    medal(state) {
      if (!state.gameOver) return null
      if (state.score === 3) return 'gold'
      if (state.score === 2) return 'silver'
      if (state.score === 1) return 'bronze'
      return 'none'
    },

    /** 獎章顯示名稱 */
    medalLabel(state) {
      const map = { gold: 'GOLD', silver: 'SILVER', bronze: 'BRONZE', none: 'TRY AGAIN' }
      return map[this.medal] || ''
    },

    /** 是否還有下一回合 */
    hasNextRound(state) {
      return state.round < state.maxRounds
    },
  },

  actions: {
    /** 切換畫面 */
    setScreen(screen) {
      this.screen = screen
    },

    /** 開始新遊戲 */
    startGame() {
      this.round = 0
      this.score = 0
      this.results = []
      this.ballReady = true
      this.ballKicked = false
      this.gameStarted = true
      this.gameOver = false
      this.lastKickSpeed = 0
      this.screen = 'game'
    },

    /** 踢球 */
    kick(speedKmh, angleDeg) {
      this.ballKicked = true
      this.ballReady = false
      this.lastKickSpeed = speedKmh
      this.lastKickAngle = angleDeg
    },

    /** 記錄回合結果 */
    recordResult(result) {
      // result: 'goal' | 'miss' | 'saved'
      this.results.push(result === 'goal' ? 'goal' : 'miss')
      if (result === 'goal') {
        this.score++
      }
      this.round++
      this.ballKicked = false

      if (this.round >= this.maxRounds) {
        this.gameOver = true
      }
    },

    /** 準備下一回合 */
    readyNextRound() {
      this.ballReady = true
      this.ballKicked = false
    },

    /** 完全重置 */
    resetAll() {
      this.round = 0
      this.score = 0
      this.results = []
      this.ballReady = true
      this.ballKicked = false
      this.gameStarted = false
      this.gameOver = false
      this.lastKickSpeed = 0
      this.lastKickAngle = 0
      this.screen = 'start'
    },

    /** 跳到成績頁 */
    showResult() {
      this.screen = 'result'
    },
  },
})
