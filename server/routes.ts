import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import type { WSMessage, DrawingStroke } from "@shared/schema";
import { gameManager } from "./game-manager";

// Reference: javascript_websocket blueprint
export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Create WebSocket server on a distinct path to avoid conflicts with Vite's HMR
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Map to track which WebSocket belongs to which player
  const connections = new Map<WebSocket, { roomCode: string; playerId: string }>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        await handleWebSocketMessage(ws, message, connections, wss);
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'خطأ في معالجة الرسالة' },
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      const connectionInfo = connections.get(ws);
      
      if (connectionInfo) {
        const { roomCode, playerId } = connectionInfo;
        handlePlayerDisconnect(roomCode, playerId, connections, wss);
      }
      
      connections.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}

async function handleWebSocketMessage(
  ws: WebSocket,
  message: WSMessage,
  connections: Map<WebSocket, { roomCode: string; playerId: string }>,
  wss: WebSocketServer
) {
  switch (message.type) {
    case 'join_room': {
      const { roomCode, playerName, isCreator } = message.payload;

      let playerId: string;
      let room;

      if (isCreator) {
        const result = gameManager.createRoom(roomCode, playerName);
        playerId = result.playerId;
        room = result.room;
      } else {
        const result = gameManager.joinRoom(roomCode, playerName);
        if (!result) {
          ws.send(JSON.stringify({
            type: 'error',
            payload: { message: 'لم يتم العثور على الغرفة أو الغرفة ممتلئة' },
          }));
          return;
        }
        playerId = result.playerId;
        room = result.room;
      }

      // Store connection info
      connections.set(ws, { roomCode, playerId });

      // Send game state to the player who just joined
      const gameState = gameManager.getClientGameState(room, playerId);
      ws.send(JSON.stringify({
        type: room.status === 'waiting' ? 'player_joined' : 'game_start',
        payload: gameState,
      }));

      // If second player joined, send game start state to both players
      if (room.players.length === 2 && room.status === 'playing') {
        // Send individual game states to each player
        room.players.forEach((player) => {
          const playerState = gameManager.getClientGameState(room, player.id);
          sendToPlayer(player.id, roomCode, {
            type: 'game_start',
            payload: playerState,
          }, connections);
        });
      }
      break;
    }

    case 'draw_stroke': {
      const connectionInfo = connections.get(ws);
      if (!connectionInfo) return;

      const { roomCode, playerId } = connectionInfo;
      const stroke: DrawingStroke = message.payload;

      // Broadcast drawing stroke to other player in the room
      broadcastToRoom(roomCode, {
        type: 'draw_stroke',
        payload: stroke,
      }, connections, wss, playerId);
      break;
    }

    case 'clear_canvas': {
      const connectionInfo = connections.get(ws);
      if (!connectionInfo) return;

      const { roomCode, playerId } = connectionInfo;

      // Broadcast clear canvas to other player
      broadcastToRoom(roomCode, {
        type: 'clear_canvas',
        payload: {},
      }, connections, wss, playerId);
      break;
    }

    case 'submit_guess': {
      const connectionInfo = connections.get(ws);
      if (!connectionInfo) return;

      const { roomCode, playerId } = connectionInfo;
      const { guess } = message.payload;

      const result = await gameManager.submitGuess(roomCode, playerId, guess);
      if (!result) {
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'لا يمكن تقديم التخمين' },
        }));
        return;
      }

      const { correct, message: resultMessage, updatedRoom } = result;

      // Send guess result to the guesser
      ws.send(JSON.stringify({
        type: 'guess_result',
        payload: {
          correct,
          message: resultMessage,
        },
      }));

      // If game is finished, send game end to both players
      if (updatedRoom.status === 'finished') {
        updatedRoom.players.forEach((player) => {
          const playerState = gameManager.getClientGameState(updatedRoom, player.id);
          sendToPlayer(player.id, roomCode, {
            type: 'game_end',
            payload: playerState,
          }, connections);
        });
      } else {
        // Send turn change to both players with updated game state
        setTimeout(() => {
          const room = gameManager.getRoom(roomCode);
          if (room) {
            room.players.forEach((player) => {
              const playerState = gameManager.getClientGameState(room, player.id);
              sendToPlayer(player.id, roomCode, {
                type: 'turn_change',
                payload: playerState,
              }, connections);
            });
          }
        }, 3000); // 3 second delay before switching turns
      }
      break;
    }

    case 'play_again': {
      const connectionInfo = connections.get(ws);
      if (!connectionInfo) return;

      const { roomCode } = connectionInfo;
      const room = gameManager.playAgain(roomCode);
      
      if (room) {
        // Send new game state to both players
        room.players.forEach((player) => {
          const playerState = gameManager.getClientGameState(room, player.id);
          sendToPlayer(player.id, roomCode, {
            type: 'game_start',
            payload: playerState,
          }, connections);
        });
      }
      break;
    }
  }
}

function broadcastToRoom(
  roomCode: string,
  message: WSMessage,
  connections: Map<WebSocket, { roomCode: string; playerId: string }>,
  wss: WebSocketServer,
  excludePlayerId?: string
) {
  const messageStr = JSON.stringify(message);
  
  connections.forEach((info, ws) => {
    if (info.roomCode === roomCode && info.playerId !== excludePlayerId) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    }
  });
}

function sendToPlayer(
  playerId: string,
  roomCode: string,
  message: WSMessage,
  connections: Map<WebSocket, { roomCode: string; playerId: string }>
) {
  const messageStr = JSON.stringify(message);
  
  connections.forEach((info, ws) => {
    if (info.roomCode === roomCode && info.playerId === playerId) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    }
  });
}

function handlePlayerDisconnect(
  roomCode: string,
  playerId: string,
  connections: Map<WebSocket, { roomCode: string; playerId: string }>,
  wss: WebSocketServer
) {
  const room = gameManager.getRoom(roomCode);
  if (!room) return;

  // If game is in progress or waiting, notify other player and clean up room
  const remainingPlayers = room.players.filter(p => p.id !== playerId);
  
  if (remainingPlayers.length === 0) {
    // No players left, remove the room
    gameManager.removeRoom(roomCode);
  } else {
    // Update room status to finished and send terminal state to remaining player
    room.status = 'finished';
    room.winnerId = remainingPlayers[0].id; // Remaining player wins by forfeit
    
    const remainingPlayerId = remainingPlayers[0].id;
    const finalState = gameManager.getClientGameState(room, remainingPlayerId);
    
    // Send game end state to remaining player
    sendToPlayer(remainingPlayerId, roomCode, {
      type: 'player_disconnect',
      payload: finalState,
    }, connections);
    
    // Clean up the room after a delay to allow the message to be sent
    setTimeout(() => {
      gameManager.removeRoom(roomCode);
    }, 2000);
  }
}
