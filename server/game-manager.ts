import { randomUUID } from "crypto";
import type { GameRoom, Player, PlayerRole, DrawingStroke, ClientGameState } from "@shared/schema";
import { getInitialWordList, getNextWord } from "./words";
import { compareGuessWithWord } from "./openai";

class GameManager {
  private rooms: Map<string, GameRoom> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly ROOM_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour in milliseconds

  createRoom(roomCode: string, playerName: string): { playerId: string; room: GameRoom } {
    const playerId = randomUUID();
    const player: Player = {
      id: playerId,
      name: playerName,
      score: 0,
      role: "drawer", // First player starts as drawer
    };

    const room: GameRoom = {
      roomCode,
      players: [player],
      status: "waiting",
      currentWord: "",
      currentDrawerId: playerId,
      currentRound: 0,
      hasGuessed: false,
      availableWords: getInitialWordList(), // Initialize shuffled word list
      lastActivityTime: Date.now(),
    };

    this.rooms.set(roomCode, room);
    return { playerId, room };
  }

  joinRoom(roomCode: string, playerName: string): { playerId: string; room: GameRoom } | null {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return null;
    }

    if (room.players.length >= 2) {
      return null; // Room is full
    }

    const playerId = randomUUID();
    const player: Player = {
      id: playerId,
      name: playerName,
      score: 0,
      role: "guesser", // Second player is the guesser
    };

    room.players.push(player);
    
    // Start the game
    if (room.players.length === 2) {
      this.startGame(room);
    }

    // Update activity time
    room.lastActivityTime = Date.now();

    return { playerId, room };
  }

  private startGame(room: GameRoom) {
    room.status = "playing";
    room.currentRound = 1;
    
    // Get next word from available words
    const { word, updatedAvailableWords } = getNextWord(room.availableWords);
    room.currentWord = word;
    room.availableWords = updatedAvailableWords;
    room.hasGuessed = false;
  }

  getRoom(roomCode: string): GameRoom | undefined {
    return this.rooms.get(roomCode);
  }

  async submitGuess(roomCode: string, playerId: string, guess: string): Promise<{
    correct: boolean;
    message: string;
    updatedRoom: GameRoom;
  } | null> {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== "playing") {
      return null;
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player || player.role !== "guesser" || room.hasGuessed) {
      return null;
    }

    // Save the current word before switching turns (for feedback message)
    const previousWord = room.currentWord;

    // Use OpenAI to compare guess with target word
    const result = await compareGuessWithWord(guess, previousWord);

    // Update score
    if (result.correct) {
      player.score = Math.max(0, player.score + 1);
    } else {
      player.score = Math.max(0, player.score - 1);
    }

    room.hasGuessed = true;

    // Check for winner
    if (player.score >= 5) {
      room.status = "finished";
      room.winnerId = playerId;
    } else {
      // Switch turns after a short delay (handled by client/server timing)
      this.switchTurns(room);
    }

    const message = result.correct
      ? `${result.explanation} • +1 نقطة`
      : `${result.explanation} • -1 نقطة • الكلمة كانت: ${previousWord}`;

    // Update activity time
    room.lastActivityTime = Date.now();

    return {
      correct: result.correct,
      message,
      updatedRoom: room,
    };
  }

  private switchTurns(room: GameRoom) {
    // Swap roles
    room.players.forEach((player) => {
      player.role = player.role === "drawer" ? "guesser" : "drawer";
    });

    // Update current drawer
    const newDrawer = room.players.find((p) => p.role === "drawer");
    if (newDrawer) {
      room.currentDrawerId = newDrawer.id;
    }

    // Get next word from available words (will reshuffle if all used)
    const { word, updatedAvailableWords } = getNextWord(room.availableWords);
    room.currentWord = word;
    room.availableWords = updatedAvailableWords;
    room.currentRound++;
    room.hasGuessed = false;
  }

  getClientGameState(room: GameRoom, playerId: string): ClientGameState {
    const player = room.players.find((p) => p.id === playerId);
    const myRole: PlayerRole = player?.role || "guesser";

    return {
      roomCode: room.roomCode,
      playerId,
      playerName: player?.name || "",
      players: room.players,
      status: room.status,
      currentWord: myRole === "drawer" ? room.currentWord : undefined,
      currentDrawerId: room.currentDrawerId,
      myRole,
      hasGuessed: room.hasGuessed,
      winnerId: room.winnerId,
      strokes: [], // Strokes are managed on client side
    };
  }

  playAgain(roomCode: string): GameRoom | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== "finished") {
      return null;
    }

    // Reset scores
    room.players.forEach((player) => {
      player.score = 0;
    });

    // Reset word list for new game
    room.availableWords = getInitialWordList();

    // Start a new game
    this.startGame(room);
    
    // Update activity time
    room.lastActivityTime = Date.now();
    
    return room;
  }

  removeRoom(roomCode: string) {
    this.rooms.delete(roomCode);
  }

  // Update the last activity timestamp for a room
  updateRoomActivity(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.lastActivityTime = Date.now();
    }
  }

  // Clean up rooms that haven't had activity in over 1 hour
  cleanupInactiveRooms() {
    const now = Date.now();
    const roomsToRemove: string[] = [];

    this.rooms.forEach((room, roomCode) => {
      const inactiveTime = now - room.lastActivityTime;
      if (inactiveTime > this.ROOM_TIMEOUT_MS) {
        roomsToRemove.push(roomCode);
        console.log(`[Cleanup] Removing inactive room ${roomCode} (inactive for ${Math.round(inactiveTime / 60000)} minutes)`);
      }
    });

    roomsToRemove.forEach((roomCode) => {
      this.rooms.delete(roomCode);
    });

    if (roomsToRemove.length > 0) {
      console.log(`[Cleanup] Removed ${roomsToRemove.length} inactive room(s)`);
    }
  }

  // Start automatic cleanup timer (runs every 5 minutes)
  startCleanupTimer() {
    if (this.cleanupInterval) {
      return; // Already running
    }

    console.log('[Cleanup] Starting automatic room cleanup (checking every 5 minutes)');
    
    // Run cleanup immediately on start
    this.cleanupInactiveRooms();
    
    // Then run every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveRooms();
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Stop cleanup timer (for graceful shutdown)
  stopCleanupTimer() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('[Cleanup] Stopped automatic room cleanup');
    }
  }
}

export const gameManager = new GameManager();
