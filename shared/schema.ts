import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Game Room types for in-memory storage
export type PlayerRole = "drawer" | "guesser";
export type GameStatus = "waiting" | "playing" | "finished";

export interface Player {
  id: string;
  name: string;
  score: number;
  role: PlayerRole;
}

export interface DrawingStroke {
  x: number;
  y: number;
  color: string;
  size: number;
  isDrawing: boolean;
  isFill?: boolean; // True if this is a fill operation
}

export interface GameRoom {
  roomCode: string;
  players: Player[];
  status: GameStatus;
  currentWord: string;
  currentDrawerId: string;
  currentRound: number;
  hasGuessed: boolean;
  winnerId?: string;
}

export interface GuessResult {
  correct: boolean;
  message: string;
}

// WebSocket message types
export type WSMessageType = 
  | "join_room"
  | "player_joined"
  | "game_start"
  | "draw_stroke"
  | "submit_guess"
  | "guess_result"
  | "turn_change"
  | "game_end"
  | "player_disconnect"
  | "error";

export interface WSMessage {
  type: WSMessageType;
  payload: any;
}

// Client-side game state
export interface ClientGameState {
  roomCode: string;
  playerId: string;
  playerName: string;
  players: Player[];
  status: GameStatus;
  currentWord?: string; // Only visible to drawer
  currentDrawerId: string;
  myRole: PlayerRole;
  hasGuessed: boolean;
  winnerId?: string;
  strokes: DrawingStroke[];
}

// Drawing colors
export const DRAWING_COLORS = [
  { name: "أحمر", nameEn: "red", value: "#EF4444" },
  { name: "أزرق", nameEn: "blue", value: "#3B82F6" },
  { name: "أخضر", nameEn: "green", value: "#10B981" },
  { name: "أصفر", nameEn: "yellow", value: "#F59E0B" },
  { name: "برتقالي", nameEn: "orange", value: "#F97316" },
  { name: "بنفسجي", nameEn: "purple", value: "#A855F7" },
  { name: "أسود", nameEn: "black", value: "#000000" },
  { name: "بني", nameEn: "brown", value: "#92400E" },
] as const;

// Brush sizes
export const BRUSH_SIZES = [
  { name: "رفيع", nameEn: "thin", value: 2 },
  { name: "متوسط", nameEn: "medium", value: 5 },
  { name: "سميك", nameEn: "thick", value: 8 },
] as const;
