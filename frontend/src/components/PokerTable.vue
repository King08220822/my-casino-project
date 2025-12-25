<template>
  <div class="table-wrapper">
    <div class="poker-table">
      
      <div class="community-cards">
        <div class="card-slot">🂠</div>
        <div class="card-slot">🂠</div>
        <div class="card-slot">🂠</div>
        <div class="card-slot">🂠</div>
        <div class="card-slot">🂠</div>
      </div>

      <div 
        v-for="(player, index) in roomData?.players || []" 
        :key="player.id"
        class="player-position"
        :style="getPlayerStyle(index, roomData.players.length)"
      >
        <PlayerSlot :player="player" />
      </div>

    </div>

    </div>
</template>

<script setup>
import PlayerSlot from './PlayerSlot.vue'; // <--- 引入剛剛寫好的元件

const props = defineProps(['roomData']);

// 計算玩家在圓桌上的位置 (數學魔法)
const getPlayerStyle = (index, total) => {
  if (total === 0) return {};
  // 把玩家平均分散在圓周上
  const angle = (index / total) * 2 * Math.PI + (Math.PI / 2); // 從下方開始排
  const radius = 220; // 半徑大小，依據你的桌子大小調整
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  
  return {
    transform: `translate(${x}px, ${y}px)`
  };
};
</script>

<style scoped>
.table-wrapper {
  display: flex; justify-content: center; align-items: center;
  height: 100vh; width: 100vw;
  background-color: #333; /* 為了凸顯綠色桌子，先把背景弄深一點 */
}

.poker-table {
  width: 600px; height: 300px;
  background: #27ae60;
  border: 10px solid #1e8449;
  border-radius: 300px; /* 橢圓形 */
  position: relative;
  display: flex; justify-content: center; align-items: center;
  box-shadow: inset 0 0 50px rgba(0,0,0,0.5);
}

.community-cards {
  display: flex; gap: 10px;
}

.card-slot {
  width: 40px; height: 60px;
  background: rgba(0,0,0,0.2);
  border-radius: 4px;
  display: flex; justify-content: center; align-items: center;
  color: rgba(255,255,255,0.5);
  font-size: 20px;
  border: 2px dashed rgba(255,255,255,0.2);
}

.player-position {
  position: absolute;
  /* 讓定位點在元件正中心 */
  top: 50%; left: 50%;
  margin-top: -40px; /* 微調垂直中心 */
  margin-left: -40px; /* 微調水平中心 */
}
</style>