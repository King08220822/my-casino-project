// backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// ▼▼▼ 引入 RoomManager，不再直接引用 PokerGame ▼▼▼
const roomManager = require('./RoomManager');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// app.use ... (省略靜態檔案設定)

io.on('connection', (socket) => {
    console.log('✅ 玩家連線:', socket.id);

    // --- 1. 取得房間列表 ---
    socket.on('getRooms', () => {
        socket.emit('roomList', roomManager.getPublicRoomList());
    });

    // --- 2. 創建房間 ---
    socket.on('createRoom', ({ roomName, password, nickname, avatar }) => {
        const roomId = roomManager.createRoom({
            roomName, 
            password, 
            hostName: nickname, 
            hostId: socket.id
        });

        // 創建後，通知前端「自動加入」
        // 前端收到 roomCreated 後，會自動發送 joinRoom 事件
        socket.emit('roomCreated', { roomId, password });
        
        // 廣播給所有人更新列表
        io.emit('roomListUpdate');
    });

    // --- 3. 加入房間 ---
    socket.on('joinRoom', ({ roomId, nickname, avatar, password }) => {
        const result = roomManager.joinRoom(roomId, socket.id, nickname, avatar, password);

        if (!result.success) {
            socket.emit('errorMsg', result.msg);
            return;
        }

        const game = result.game;
        socket.join(roomId);
        
        // 通知自己成功
        socket.emit('joinSuccess', { roomId });

        // 通知房間內其他人
        io.to(roomId).emit('roomUpdated', {
            players: game.players.map(p => p.getPublicData()), 
            gameState: game.gameState,
            currentTurn: game.currentTurnPlayerId,
            hostId: game.hostId, // 前端依靠這個顯示開始按鈕
            pot: game.pot,
            communityCards: game.getPublicCommunityCards()
        });

        // 更新大廳列表 (因為人數變了)
        io.emit('roomListUpdate');
    });

    // --- 4. 遊戲開始 ---
    socket.on('startGame', (roomId) => {
        const game = roomManager.getGame(roomId);
        if (!game) return;

        const result = game.manualStart(socket.id);
        if (result.success) {
            io.to(roomId).emit('gameStarted', { gameState: 'PLAYING' });
            
            // 發私有牌
            game.players.forEach(p => {
                io.to(p.id).emit('receiveCards', { myCards: p.cards });
            });

            // 更新公開資訊
            io.to(roomId).emit('roomUpdated', {
                players: game.players.map(p => p.getPublicData()),
                gameState: game.gameState,
                pot: game.pot,
                communityCards: game.getPublicCommunityCards(),
                currentTurn: game.currentTurnPlayerId,
                hostId: game.hostId
            });
            
            // 遊戲狀態改變，列表也要更新 (顯示遊戲中)
            io.emit('roomListUpdate');
        }
    });

    // --- 5. 玩家動作 (下注等) ---
    socket.on('action', ({ roomId, type, amount }) => {
        const game = roomManager.getGame(roomId);
        if (!game) return;

        const result = game.handlePlayerAction(socket.id, type, amount);
        
        if (result.success) {
            // 1. 動作合法，廣播盤面更新
            io.to(roomId).emit('roomUpdated', {
                players: game.players.map(p => p.getPublicData(game.gameState === 'SHOWDOWN')), 
                gameState: game.gameState,
                pot: game.pot,
                communityCards: game.getPublicCommunityCards(),
                currentTurn: game.currentTurnPlayerId
            });
            
            // 2. 檢查是否進入結算 (Showdown)
            if (game.gameState === 'SHOWDOWN') {
                
                // 製作排行榜
                const rankings = game.players
                    .map(p => ({
                        id: p.id,
                        name: p.name,
                        chips: p.chips,
                        isWinner: game.lastRoundWinners.some(w => w.id === p.id) 
                    }))
                    .sort((a, b) => b.chips - a.chips);
                     
                // 廣播結算資訊
                io.to(roomId).emit('gameEnded', { 
                    winners: game.lastRoundWinners,
                    rankings: rankings,
                    newGameCountdown: 5 // 告訴前端倒數 5 秒
                });

                // --- 5 秒後自動開始新局 (包含踢人邏輯) ---
                setTimeout(() => {
                    // 重新從 Manager 獲取遊戲實例 (確保房間還活著)
                    // 注意：這裡不能只用原本的 game 變數，因為如果房間被刪了，操作會出錯
                    const liveGame = roomManager.getGame(roomId);

                    if (liveGame) {
                        // ▼▼▼ 【新增】踢除破產玩家邏輯 ▼▼▼
                        // 1. 找出籌碼 <= 0 的玩家 (必須在 beginGame 之前做)
                        const brokePlayers = liveGame.players.filter(p => p.chips <= 0);

                        brokePlayers.forEach(p => {
                            console.log(`💸 玩家 ${p.name} 破產，踢出房間`);
                            
                            // A. 呼叫 Manager 執行離開 (處理陣列移除、房主轉移、刪除空房)
                            roomManager.leaveRoom(roomId, p.id);

                            // B. 通知該玩家 (前端收到 kicked 事件要跳轉回大廳)
                            io.to(p.id).emit('kicked', { msg: '您的籌碼已歸零，請重新加入遊戲！' });
                            
                            // C. 強制讓 Socket 離開頻道 (這樣他就收不到下一局的牌了)
                            const socketInfo = io.sockets.sockets.get(p.id);
                            if (socketInfo) {
                                socketInfo.leave(roomId);
                            }
                        });

                        // 踢完人後，再次檢查房間是否還存在 (如果所有人都破產被踢光了)
                        if (!roomManager.getGame(roomId)) return;
                        // ▲▲▲ ▲▲▲

                        console.log(`房間 ${roomId} 自動開始下一局...`);
                        
                        // 1. 重置並開始新局 (破產的人已經不在 liveGame.players 裡了)
                        liveGame.beginGame(); 

                        // 2. 廣播新局開始
                        io.to(roomId).emit('gameStarted', { gameState: 'PLAYING' });

                        // 3. 發新牌 (只發給還在且非機器人的)
                        liveGame.players.forEach(p => {
                            if (p.status !== 'SIT_OUT') {
                                io.to(p.id).emit('receiveCards', { myCards: p.cards });
                            }
                        });

                        // 4. 更新畫面 (因為人數變了，Host可能變了，這裡會同步更新)
                        io.to(roomId).emit('roomUpdated', {
                            players: liveGame.players.map(p => p.getPublicData()),
                            gameState: liveGame.gameState,
                            pot: liveGame.pot,
                            communityCards: [], 
                            currentTurn: liveGame.currentTurnPlayerId,
                            hostId: liveGame.hostId // 更新房主
                        });

                        // 5. 因為有人被踢，大廳列表的人數也要更新
                        io.emit('roomListUpdate');
                    }
                }, 5000); 
            }

        } else {
            // 動作非法
            socket.emit('errorMsg', result.msg);
        }
    });

    // --- 6. 斷線/離開 ---
    socket.on('disconnect', () => {
        // 這裡需要遍歷找人，因為 socket.id 沒帶 roomId
        // RoomManager 沒有反向查表，所以我們要遍歷 (效率較低但這階段夠用)
        for (const roomId in roomManager.rooms) {
            const game = roomManager.leaveRoom(roomId, socket.id);
            if (game) {
                // 房間還在，通知剩餘玩家
                io.to(roomId).emit('roomUpdated', {
                    players: game.players.map(p => p.getPublicData()),
                    gameState: game.gameState,
                    hostId: game.hostId // 房主可能換人了
                });
            }
            // 無論房間是否還在，都要更新列表 (人數變少或房間消失)
            io.emit('roomListUpdate');
        }
    });
    
    // 主動離開房間
    socket.on('leaveRoom', () => {
         for (const roomId in roomManager.rooms) {
            const game = roomManager.leaveRoom(roomId, socket.id);
            if (game) {
                 io.to(roomId).emit('roomUpdated', {
                    players: game.players.map(p => p.getPublicData()),
                    gameState: game.gameState,
                    hostId: game.hostId
                });
            }
         }
         io.emit('roomListUpdate');
    });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`🚀 後端伺服器啟動: http://localhost:${PORT}`));