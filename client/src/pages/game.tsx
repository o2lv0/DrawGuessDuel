import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { DrawingCanvas } from "@/components/game/drawing-canvas";
import { Scoreboard } from "@/components/game/scoreboard";
import { GuessInput } from "@/components/game/guess-input";
import { GameHeader } from "@/components/game/game-header";
import { WaitingRoom } from "@/components/game/waiting-room";
import { VictoryScreen } from "@/components/game/victory-screen";
import { FeedbackOverlay } from "@/components/game/feedback-overlay";
import { useGameWebSocket } from "@/hooks/use-game-websocket";
import type { ClientGameState, DrawingStroke } from "@shared/schema";

export default function Game() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const roomCode = params.get("room");
  const playerName = params.get("name");
  const isCreator = params.get("create") === "true";

  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [undoHistory, setUndoHistory] = useState<DrawingStroke[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawingStroke[][]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "correct" | "incorrect"; text: string } | null>(null);
  
  const MAX_UNDO_HISTORY = 50;

  // Deep clone strokes array to ensure immutability
  const deepCloneStrokes = (strokes: DrawingStroke[]): DrawingStroke[] => {
    return strokes.map(stroke => ({ ...stroke }));
  };
  
  const { sendMessage, connected } = useGameWebSocket({
    roomCode: roomCode || "",
    playerName: playerName || "",
    isCreator,
    onGameStateUpdate: (state) => {
      setGameState(state);
    },
    onDrawStroke: (stroke) => {
      setStrokes((prev) => [...prev, stroke]);
    },
    onClearCanvas: () => {
      setStrokes([]);
      setUndoHistory([]);
      setRedoStack([]);
    },
    onGuessResult: (result) => {
      setFeedbackMessage({
        type: result.correct ? "correct" : "incorrect",
        text: result.message,
      });
      setTimeout(() => setFeedbackMessage(null), 2500);
    },
  });

  useEffect(() => {
    if (!roomCode || !playerName) {
      setLocation("/");
    }
  }, [roomCode, playerName, setLocation]);

  const handleDraw = (stroke: DrawingStroke) => {
    // For the start of a stroke or fill action, save current state to history BEFORE applying
    if (!stroke.isDrawing || stroke.isFill) {
      setStrokes((prev) => {
        // Save a DEEP CLONE of the state BEFORE this action to avoid reference corruption
        setUndoHistory((hist) => {
          const newHistory = [...hist, deepCloneStrokes(prev)]; // Deep clone
          // Keep only last 50 states
          if (newHistory.length > MAX_UNDO_HISTORY) {
            newHistory.shift();
          }
          return newHistory;
        });
        // Clear redo stack when new drawing occurs
        setRedoStack([]);
        return [...prev, stroke]; // Return new state with stroke added
      });
    } else {
      // For continuing strokes, just add without saving history
      setStrokes((prev) => [...prev, stroke]);
    }
    
    sendMessage({
      type: "draw_stroke",
      payload: stroke,
    });
  };

  const handleStrokeComplete = () => {
    // No longer needed - history is saved at stroke start
  };

  const handleUndo = () => {
    if (undoHistory.length === 0) return;
    
    const previousState = undoHistory[undoHistory.length - 1];
    const currentState = strokes;
    
    // Add DEEP CLONE of current state to redo stack
    setRedoStack((stack) => {
      const newStack = [...stack, deepCloneStrokes(currentState)]; // Deep clone
      if (newStack.length > MAX_UNDO_HISTORY) {
        newStack.shift();
      }
      return newStack;
    });
    
    // Remove last state from undo history
    setUndoHistory((hist) => hist.slice(0, -1));
    
    // Restore previous state (deep clone to avoid mutations)
    setStrokes(deepCloneStrokes(previousState));
    
    // Broadcast undo to other players
    sendMessage({
      type: "clear_canvas",
      payload: {},
    });
    
    // Re-send all strokes from previous state (create new objects for broadcast)
    previousState.forEach((stroke) => {
      sendMessage({
        type: "draw_stroke",
        payload: { ...stroke }, // Clone stroke for broadcast
      });
    });
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    
    const nextState = redoStack[redoStack.length - 1];
    const currentState = strokes;
    
    // Add DEEP CLONE of current state back to undo history
    setUndoHistory((hist) => {
      const newHistory = [...hist, deepCloneStrokes(currentState)]; // Deep clone
      if (newHistory.length > MAX_UNDO_HISTORY) {
        newHistory.shift();
      }
      return newHistory;
    });
    
    // Remove last state from redo stack
    setRedoStack((stack) => stack.slice(0, -1));
    
    // Restore next state (deep clone to avoid mutations)
    setStrokes(deepCloneStrokes(nextState));
    
    // Broadcast redo to other players
    sendMessage({
      type: "clear_canvas",
      payload: {},
    });
    
    // Re-send all strokes from next state (create new objects for broadcast)
    nextState.forEach((stroke) => {
      sendMessage({
        type: "draw_stroke",
        payload: { ...stroke }, // Clone stroke for broadcast
      });
    });
  };

  const handleClearCanvas = () => {
    // Save DEEP CLONE of current state to undo history before clearing
    if (strokes.length > 0) {
      setUndoHistory((hist) => {
        const newHistory = [...hist, deepCloneStrokes(strokes)]; // Deep clone
        if (newHistory.length > MAX_UNDO_HISTORY) {
          newHistory.shift();
        }
        return newHistory;
      });
      setRedoStack([]);
    }
    
    setStrokes([]);
    sendMessage({
      type: "clear_canvas",
      payload: {},
    });
  };

  const handleSubmitGuess = (guess: string) => {
    sendMessage({
      type: "submit_guess",
      payload: { guess },
    });
  };

  const handleLeaveGame = () => {
    setLocation("/");
  };

  const handlePlayAgain = () => {
    sendMessage({
      type: "play_again",
      payload: {},
    });
  };

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-lg text-muted-foreground">جاري الاتصال...</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-lg text-muted-foreground">جاري تحميل اللعبة...</p>
        </div>
      </div>
    );
  }

  if (gameState.status === "waiting") {
    return <WaitingRoom roomCode={gameState.roomCode} playerName={gameState.playerName} onLeave={handleLeaveGame} />;
  }

  if (gameState.status === "finished" && gameState.winnerId) {
    const winner = gameState.players.find((p) => p.id === gameState.winnerId);
    return (
      <VictoryScreen
        winnerName={winner?.name || ""}
        isWinner={gameState.winnerId === gameState.playerId}
        players={gameState.players}
        onPlayAgain={handlePlayAgain}
        onLeave={handleLeaveGame}
      />
    );
  }

  const isDrawer = gameState.myRole === "drawer";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GameHeader
        roomCode={gameState.roomCode}
        onLeave={handleLeaveGame}
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* Scoreboard - Top on mobile, Right on desktop */}
        <div className="lg:order-2 lg:w-80">
          <Scoreboard
            players={gameState.players}
            currentPlayerId={gameState.playerId}
            currentDrawerId={gameState.currentDrawerId}
          />
        </div>

        {/* Main game area */}
        <div className="flex-1 lg:order-1 flex flex-col gap-4">
          {/* Current word display for drawer */}
          {isDrawer && gameState.currentWord && (
            <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-4 text-center" data-testid="drawer-word-display">
              <p className="text-sm text-muted-foreground mb-1">ارسم هذه الكلمة</p>
              <p className="text-3xl font-bold text-primary">{gameState.currentWord}</p>
            </div>
          )}

          {/* Role indicator for guesser */}
          {!isDrawer && (
            <div className="bg-accent/50 border border-accent-border rounded-lg p-3 text-center" data-testid="guesser-indicator">
              <p className="text-base text-accent-foreground font-medium">
                {gameState.hasGuessed ? "في انتظار اللاعب الآخر..." : "شاهد الرسم وخمّن الكلمة"}
              </p>
            </div>
          )}

          {/* Drawing Canvas */}
          <DrawingCanvas
            strokes={strokes}
            onDraw={handleDraw}
            onClear={handleClearCanvas}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={undoHistory.length > 0 && isDrawer}
            canRedo={redoStack.length > 0 && isDrawer}
            isDrawer={isDrawer}
          />

          {/* Guess Input - Only for guesser and if they haven't guessed yet */}
          {!isDrawer && !gameState.hasGuessed && (
            <GuessInput onSubmit={handleSubmitGuess} />
          )}
        </div>
      </div>

      {/* Feedback Overlay */}
      {feedbackMessage && (
        <FeedbackOverlay
          type={feedbackMessage.type}
          message={feedbackMessage.text}
        />
      )}
    </div>
  );
}
