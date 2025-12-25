<script setup>
import { ref, onMounted } from 'vue';
import Lobby from './components/Lobby.vue';
import RoomSetup from './components/RoomSetup.vue';
import PokerTable from './components/PokerTable.vue';
import socket from './services/socket';

// 1. 狀態機 (LOBBY -> SETUP -> PLAYING)
const currentView = ref('LOBBY');
const roomData = ref(null);

// 2. 監聽後端數據
onMounted(() => {
  socket.on('roomUpdated', (data) => {
    roomData.value = data;
    // 這裡通常不需要強制切換，因為加入時就會手動切換了
    // 但保留著以防萬一（例如斷線重連）
    if (data.gameState === 'PLAYING' && currentView.value === 'LOBBY') {
       // 選擇性邏輯，目前可以先不動
    }
  });

  socket.on('errorMsg', (msg) => alert(msg));
});

// 3. 【關鍵修改】UI 跳轉邏輯
const selectGame = (type) => {
  if (type === 'poker') {
    // 嘗試從 sessionStorage 拿出剛剛在大廳輸入的名字
    const name = sessionStorage.getItem('player_nickname');
    
    if (name) {
       // A. 有名字 -> 直接發送加入訊號，並進入牌桌
       console.log("偵測到暱稱，直接加入房間:", name);
       socket.emit('joinRoom', { roomId: 'poker_table_1', nickname: name });
       currentView.value = 'PLAYING'; 
    } else {
       // B. 沒名字 (例外狀況) -> 還是去設定頁
       currentView.value = 'SETUP';
    }
  }
};

// 這是給 RoomSetup 用的 (備用)
const joinRoom = () => {
  currentView.value = 'PLAYING';
};
</script>

<template>
  <div class="game-wrapper">
    <transition name="view-fade" mode="out-in">
      
      <Lobby 
        v-if="currentView === 'LOBBY'" 
        @select="selectGame" 
      />
      
      <RoomSetup 
        v-else-if="currentView === 'SETUP'" 
        @join="joinRoom" 
      />
      
      <PokerTable 
        v-else-if="currentView === 'PLAYING'" 
        :room-data="roomData" 
      />

    </transition>
  </div>
</template>

<style>
/* 引入 Gartic 風格全域樣式 */
@import "./assets/main.css"; 

/* 轉場動畫：稍微帶點 Gartic 的彈性 */
.view-fade-enter-active,
.view-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* 彈跳效果 */
}

.view-fade-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
}

.view-fade-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

.game-wrapper {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  /* 預設背景色 (牌桌時會看到這個)，Lobby 會有自己的深藍色覆蓋 */
  background-color: #e5e5e5; 
  overflow: hidden;
}
</style>