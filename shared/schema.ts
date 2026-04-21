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
  availableWords: string[]; // Words that haven't been used yet in this cycle
  lastActivityTime: number; // Timestamp of last activity in milliseconds
}

export interface GuessResult {
  correct: boolean;
  message: string;
}

// WebSocket message types
export type WSMessageType = 
  | "join_room"
  | "reconnect_room"
  | "player_joined"
  | "game_start"
  | "draw_stroke"
  | "clear_canvas"
  | "submit_guess"
  | "guess_result"
  | "turn_change"
  | "game_end"
  | "player_disconnect"
  | "play_again"
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

// Drawing colors - Expanded palette for better drawing options
export const DRAWING_COLORS = [
  { name: "أحمر", nameEn: "red", value: "#EF4444" },
  { name: "وردي", nameEn: "pink", value: "#EC4899" },
  { name: "برتقالي", nameEn: "orange", value: "#F97316" },
  { name: "أصفر", nameEn: "yellow", value: "#F59E0B" },
  { name: "أخضر فاتح", nameEn: "light-green", value: "#22C55E" },
  { name: "أخضر", nameEn: "green", value: "#059669" },
  { name: "أزرق فاتح", nameEn: "light-blue", value: "#38BDF8" },
  { name: "أزرق", nameEn: "blue", value: "#3B82F6" },
  { name: "بنفسجي", nameEn: "purple", value: "#A855F7" },
  { name: "بني", nameEn: "brown", value: "#92400E" },
  { name: "رمادي", nameEn: "gray", value: "#6B7280" },
  { name: "أسود", nameEn: "black", value: "#000000" },
  { name: "أبيض", nameEn: "white", value: "#FFFFFF" },
] as const;

// Brush sizes
export const BRUSH_SIZES = [
  { name: "رفيع", nameEn: "thin", value: 2 },
  { name: "متوسط", nameEn: "medium", value: 5 },
  { name: "سميك", nameEn: "thick", value: 8 },
] as const;
