import { randomUUID } from "crypto";
import type { GameRoom, Player, PlayerRole, DrawingStroke, ClientGameState } from "@shared/schema";
import { getRandomWord } from "./words";
import { compareGuessWithWord } from "./openai";

class GameManager {
  private rooms: Map<string, GameRoom> = new Map();

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

    return { playerId, room };
  }

  private startGame(room: GameRoom) {
    room.status = "playing";
    room.currentRound = 1;
    room.currentWord = getRandomWord();
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

    // Use OpenAI to compare guess with target word
    const result = await compareGuessWithWord(guess, room.currentWord);

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
      : `${result.explanation} • -1 نقطة • الكلمة كانت: ${room.currentWord}`;

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

    // New word and round
    room.currentWord = getRandomWord();
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

    // Start a new game
    this.startGame(room);
    
    return room;
  }

  removeRoom(roomCode: string) {
    this.rooms.delete(roomCode);
  }
}

export const gameManager = new GameManager();
