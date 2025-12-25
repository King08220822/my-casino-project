<template>
  <div class="slot-container" :class="{ 'is-active': player.isCurrentTurn }">
    
    <div class="avatar">
      <span v-if="player.isHost" class="crown">👑</span>
      👤
    </div>

    <div class="info-box">
      <div class="name">{{ player.name }}</div>
      <div class="chips">
        💰 ${{ player.chips.toLocaleString() }}
      </div>
    </div>

    <div class="hand-cards" v-if="player.cards && player.cards.length > 0">
      <div v-for="(card, i) in player.cards" :key="i" class="mini-card">
        {{ card ? card.suit + card.value : '🂠' }}
      </div>
    </div>

  </div>
</template>

<script setup>
defineProps(['player']);
</script>

<style scoped>
.slot-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  transition: all 0.3s;
}

/* 頭像圈圈 */
.avatar {
  width: 60px; height: 60px;
  background: #eef2f5;
  border-radius: 50%;
  border: 4px solid #fff;
  display: flex; justify-content: center; align-items: center;
  font-size: 30px;
  box-shadow: 0 4px 0 rgba(0,0,0,0.1);
  z-index: 2;
  position: relative;
}

.crown {
  position: absolute; top: -15px; right: -5px;
  font-size: 20px;
}

/* 名字與籌碼框 (Gartic 的白色圓角框) */
.info-box {
  background: white;
  padding: 5px 15px;
  border-radius: 12px;
  text-align: center;
  margin-top: -10px; /* 讓它稍微塞進頭像下面 */
  border: 2px solid #ddd;
  min-width: 80px;
  z-index: 1;
}

.name { font-weight: bold; color: #333; font-size: 0.9rem; }
.chips { font-size: 0.8rem; color: #f1c40f; font-weight: bold; }

/* 輪到該玩家時的黃色高亮 */
.is-active .avatar { border-color: #f1c40f; }
.is-active .info-box { border-color: #f1c40f; box-shadow: 0 0 10px #f1c40f; }

/* 小手牌 */
.hand-cards {
  display: flex; gap: 5px; margin-top: 5px;
}
.mini-card {
  background: white; padding: 2px 5px; border-radius: 4px; font-size: 12px;
  border: 1px solid #ccc;
}
</style>