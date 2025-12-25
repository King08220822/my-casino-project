<template>
  <div class="gartic-body">
    <div class="main-card">
      
      <div class="logo-area">
        <h1 class="game-title">Gartic<span class="highlight">Poker</span></h1>
        <div class="subtitle">德州撲克 .io</div>
      </div>

      <div class="content-row">
        
        <div class="avatar-section">
          <div class="avatar-circle">
            👤
          </div>
          <button class="btn-icon">✏️</button>
        </div>

        <div class="input-section">
          <label>暱稱</label>
          <input 
            v-model="nickname" 
            type="text" 
            placeholder="輸入你的名字..." 
            maxlength="10"
            @keyup.enter="startGame"
          >

          <div class="game-select">
            <label>遊戲模式</label>
            <div class="mode-box active">
              🃏 德州撲克
            </div>
          </div>

          <button class="btn-play" @click="startGame">
            開始遊戲
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import socket from '../services/socket';

const nickname = ref('');
const emit = defineEmits(['select']);

const startGame = () => {
  if (!nickname.value) return alert("請輸入暱稱！");
  
  // 這裡我們稍微偷吃步，直接把名字傳出去，同時選擇 poker
  // 這樣 App.vue 就會切換到 SETUP (或者我們可以改邏輯直接進遊戲)
  
  // 為了配合你目前的 App.vue 流程，我們先觸發 'select'，
  // 但建議把名字暫存在 localStorage 或透過 emit 傳遞
  sessionStorage.setItem('player_nickname', nickname.value); 
  emit('select', 'poker');
};
</script>

<style scoped>
/* Gartic 風格深藍背景，只在這個組件生效，或者你可以放到全域 */
.gartic-body {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background-color: #0F1526; /* Gartic 深藍色 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.main-card {
  background: white;
  width: 700px;
  max-width: 90%;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 0 #080b14; /* 深色陰影創造立體感 */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-area {
  margin-bottom: 30px;
  text-align: center;
}

.game-title {
  font-size: 3.5rem;
  margin: 0;
  color: #3b4861;
  font-weight: 900;
  letter-spacing: -2px;
}

.highlight {
  color: #f1c40f; /* 撲克金 */
}

.subtitle {
  color: #888;
  font-weight: bold;
  letter-spacing: 2px;
}

.content-row {
  display: flex;
  gap: 40px;
  width: 100%;
  justify-content: center;
  align-items: center;
}

/* 頭像區 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.avatar-circle {
  width: 120px;
  height: 120px;
  background: #eef2f5;
  border-radius: 50%;
  font-size: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid #ddd;
}

.btn-icon {
  background: #3b4861;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px; height: 30px;
  cursor: pointer;
}

/* 輸入區 */
.input-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

label {
  font-weight: bold;
  color: #3b4861;
  font-size: 0.9rem;
  text-align: left;
}

input {
  padding: 12px 15px;
  border: 2px solid #ddd;
  border-radius: 10px;
  font-size: 1.2rem;
  outline: none;
  transition: border-color 0.2s;
}

input:focus {
  border-color: #5cb85c;
}

.mode-box {
  padding: 10px;
  border: 2px solid #5cb85c;
  background: #eaffea;
  border-radius: 10px;
  color: #2c7a2c;
  font-weight: bold;
  text-align: center;
}

/* 巨型開始按鈕 */
.btn-play {
  background: #5cb85c;
  color: white;
  font-size: 1.5rem;
  font-weight: 900;
  padding: 15px;
  border: none;
  border-radius: 12px;
  border-bottom: 6px solid #3e8f3e; /* 厚度感 */
  cursor: pointer;
  margin-top: 10px;
  transition: all 0.1s;
}

.btn-play:active {
  transform: translateY(6px); /* 按下去的動畫 */
  border-bottom-width: 0px;
}

/* 手機版適配 */
@media (max-width: 600px) {
  .content-row {
    flex-direction: column;
  }
}
</style>