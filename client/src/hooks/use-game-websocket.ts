import { useEffect, useRef, useState } from "react";
import type { WSMessage, ClientGameState, DrawingStroke, GuessResult } from "@shared/schema";

interface UseGameWebSocketProps {
  roomCode: string;
  playerName: string;
  isCreator: boolean;
  onGameStateUpdate: (state: ClientGameState) => void;
  onDrawStroke: (stroke: DrawingStroke) => void;
  onClearCanvas: () => void;
  onGuessResult: (result: GuessResult) => void;
}

export function useGameWebSocket({
  roomCode,
  playerName,
  isCreator,
  onGameStateUpdate,
  onDrawStroke,
  onClearCanvas,
  onGuessResult,
}: UseGameWebSocketProps) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
      
      // Join the room
      sendMessage({
        type: "join_room",
        payload: {
          roomCode,
          playerName,
          isCreator,
        },
      });
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [roomCode, playerName, isCreator]);

  const handleMessage = (message: WSMessage) => {
    switch (message.type) {
      case "player_joined":
      case "game_start":
      case "turn_change":
      case "game_end":
      case "player_disconnect":
        if (message.payload) {
          onGameStateUpdate(message.payload as ClientGameState);
        }
        break;
      
      case "draw_stroke":
        onDrawStroke(message.payload as DrawingStroke);
        break;
      
      case "clear_canvas":
        onClearCanvas();
        break;
      
      case "guess_result":
        onGuessResult(message.payload as GuessResult);
        break;
      
      case "error":
        console.error("Server error:", message.payload);
        break;
      
      default:
        console.warn("Unknown message type:", message.type);
    }
  };

  const sendMessage = (message: WSMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return {
    connected,
    sendMessage,
  };
}
