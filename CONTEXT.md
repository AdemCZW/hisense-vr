# VR Penalty Kick — 專案上下文

## 專案概要
為 Hisense 展場建置 VR Penalty Kick 互動體驗。觀眾戴上 VR 頭盔，透過腿部感測器踢球，與 AI 守門員對決三回合，最後依成績頒發金銀銅獎章並提供 QR Code 下載互動影片。

## 技術選型決策
- **框架**: WebXR + Three.js（非 Babylon.js、非 Unity）
- **選擇原因**: 團隊是 Vue/JS 背景，WebXR 免安裝、掃碼即玩，適合展場場景
- **Babylon.js 備案**: 如果 Three.js 在物理/WebXR 整合上遇到太多摩擦，可以考慮切換。Babylon.js 內建 WebXR Manager、物理引擎、GUI 系統，開箱即用
- **前端框架**: Vue 3 + Vite（外層 UI：待機畫面、教學引導、成績頁）
- **物理引擎**: Cannon.js（待整合，目前用簡化拋體運動）
- **3D 模型格式**: GLTF

## 遊戲流程（對應設計文件）
1. **Step 1 — 教學 & 穿戴裝備**（~1 min）
   - 待機首頁：輪播動畫 + START 按鈕（Vue 2D overlay）
   - 裝備佩戴提示：腳部感測器 → VR 面罩紙 → VR 頭盔
   - 按下 START 才進入 WebXR immersive-vr session
2. **Step 2 — 定位校準**（~15s）
   - 視線定位：看向目標點，用 XRReferenceSpace 確認頭盔方向
   - 踢球定位：確認腿部感測器 IMU 有訊號
3. **Step 3 — 踢球互動**（~3 min）
   - 三回合，AI 守門員難度遞增（反應速度 + 撲救範圍）
   - 球的軌跡由物理引擎計算
   - 踢球角度/速度從 Leg Tracker IMU 加速度推算
   - 成績依據「踢球角度」與「速度」給回饋
4. **Step 4 — 結算成績**（~1 min）
   - 退出 VR session，回到 Vue 2D 畫面
   - 依進球數頒發金/銀/銅 RGB 激光射門獎章
   - 提供 QR Code 下載互動影片

## 硬體配置
- **產品**: Hisense XR10 Laser Projector + VR headset
- **腿部追蹤**: 獨立 Leg Tracker（IMU 感測器），連接方式待確認
  - 可能方案：Web Bluetooth 或 WebSocket server 轉發
  - 需確認硬體 SDK 支援的通訊協定

## 目前進度
- [x] 基礎 prototype 完成（index.html）
  - 足球場場景（球場線條、罰球區、球門框、球網、觀眾看台、燈柱）
  - 守門員 AI（三回合難度遞增、待機左右晃動、撲救動畫）
  - 簡化球物理（拋體運動 + 重力 + 地面彈跳）
  - 計分系統（三回合圓點、金銀銅獎章）
  - 桌面模式：滑鼠瞄準十字準星 + 點擊射門
  - WebXR 支援：偵測 VR 裝置，顯示 Enter VR 按鈕
- [ ] 整合 Cannon.js 做更真實的球物理
- [ ] 替換 GLTF 模型（守門員、足球場、足球）
- [ ] 接入 Leg Tracker 感測器
- [ ] 加入音效（踢球聲、觀眾歡呼、進球音效）
- [ ] 加入觸覺回饋（controller vibration）
- [ ] QR Code 生成 + 影片錄製/回放
- [ ] Vue 外層 UI（待機輪播、教學動畫、成績頁）

## 技術架構
```
前端展示層（Vue 3 + Vite）
  ├── 待機首頁（輪播 + START）
  ├── 教學 UI（裝備引導動畫）
  └── 成績 + QR Code（獎章 / 影片下載）
       │
WebXR + Three.js 核心層
  ├── 足球場場景（GLTF 模型）
  ├── 球物理引擎（Cannon.js）
  ├── AI 守門員（難度遞增邏輯）
  ├── 定位校準（視線 + 踢球）
  ├── WebXR Session Manager
  └── XR Input（controller / hand）
       │
感測器層
  ├── Web Bluetooth / WebSocket
  ├── Leg Tracker IMU
  └── 踢球速度 + 角度計算
       │
後端 / 資料層
  ├── Node.js / Express API
  ├── 成績 DB + 排行榜
  └── QR Code + 影片生成
```

## 參考資源
- Meta WebXR First Steps 教程（Three.js + WebXR 完整遊戲教學）
- WebXR Body Tracking Module（W3C 規範）
- Three.js WebXR examples: https://threejs.org/examples/?q=webxr
