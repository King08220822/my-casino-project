<script setup>
import { ref, onMounted } from 'vue';
import Lobby from './components/Lobby.vue';
import PokerTable from './components/PokerTable.vue';
import socket from './services/socket';
import RoomList from './components/RoomList.vue';
import InteractiveBackground from './components/InteractiveBackground.vue';

// 狀態機 (LOBBY -> ROOM_LIST -> PLAYING)
const currentView = ref('LOBBY');
const roomData = ref(null);
const currentRoomId = ref(''); // 用來存目前所在的房間 ID

// 3. 監聽後端數據
onMounted(() => {
  // 監聽房間更新
  socket.on('roomUpdated', (data) => {
    roomData.value = data;
  });

  // 監聽加入成功訊號
  socket.on('joinSuccess', ({ roomId }) => { // 也可以這裡接收 roomId 確保同步
    currentView.value = 'PLAYING';
  });

  socket.on('errorMsg', (msg) => alert(msg));
});

// 4. UI 跳轉邏輯
const selectGame = (type) => {
  if (type === 'poker') {
    const name = sessionStorage.getItem('player_nickname');
    if (name) {
       currentView.value = 'ROOM_LIST'; 
    } else {
       alert("請先輸入暱稱");
    }
  }
};

const handleJoinRoom = ({ roomId, password }) => {
    // ▼▼▼ 【修正 1】記住房間 ID！ ▼▼▼
    currentRoomId.value = roomId; 
    
    const nickname = sessionStorage.getItem('player_nickname');
    const avatar = sessionStorage.getItem('player_avatar');

    // 發送加入請求
    socket.emit('joinRoom', { 
        roomId, 
        nickname, 
        avatar: avatar || '/avatars/1.jpg',
        password 
    });
};

const backToLobby = () => {
  currentView.value = 'LOBBY';
};

const leaveGame = () => {
  socket.emit('leaveRoom'); 
  currentView.value = 'ROOM_LIST'; 
  roomData.value = null;
  currentRoomId.value = ''; // 離開時清空 ID
};
</script>

<template>
  <div class="game-wrapper">
    <InteractiveBackground />
    <transition name="view-fade" mode="out-in">
      
      <Lobby 
        v-if="currentView === 'LOBBY'" 
        @select="selectGame" 
      />
      
      <RoomList 
        v-else-if="currentView === 'ROOM_LIST'"
        @join="handleJoinRoom"
        @back="backToLobby" 
      />
      
      <PokerTable 
        v-else-if="currentView === 'PLAYING'" 
        :room-data="roomData" 
        :room-id="currentRoomId"
        @leave="leaveGame"
      />

    </transition>
  </div>
</template>

<style>
@import "./assets/main.css"; 

.view-fade-enter-active,
.view-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
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
  overflow: hidden;
}
</style>