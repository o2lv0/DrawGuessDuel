import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Pencil, Eye } from "lucide-react";
import type { Player } from "@shared/schema";

interface ScoreboardProps {
  players: Player[];
  currentPlayerId: string;
  currentDrawerId: string;
}

export function Scoreboard({ players, currentPlayerId, currentDrawerId }: ScoreboardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          النتيجة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {players.map((player) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          const isDrawer = player.id === currentDrawerId;
          const isLeading = players.every(p => p.id === player.id || player.score >= p.score);
          
          return (
            <div
              key={player.id}
              data-testid={`player-card-${player.id}`}
              className={`p-4 rounded-lg border-2 transition-all ${
                isCurrentPlayer
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card"
              } ${isDrawer ? "ring-2 ring-primary/30" : ""}`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      isCurrentPlayer
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${
                      isCurrentPlayer ? "text-primary" : "text-foreground"
                    }`} data-testid={`player-name-${player.id}`}>
                      {player.name}
                    </p>
                    {isCurrentPlayer && (
                      <p className="text-xs text-muted-foreground">أنت</p>
                    )}
                  </div>
                </div>
                
                <div className="text-left">
                  <div className={`text-3xl font-bold ${
                    isCurrentPlayer ? "text-primary" : "text-foreground"
                  }`} data-testid={`player-score-${player.id}`}>
                    {player.score}
                  </div>
                  {isLeading && player.score > 0 && (
                    <Trophy className="w-4 h-4 text-yellow-500 mx-auto" />
                  )}
                </div>
              </div>
              
              {isDrawer && (
                <Badge
                  data-testid={`drawer-badge-${player.id}`}
                  className="w-full justify-center"
                  variant="default"
                >
                  <Pencil className="w-3 h-3 ml-1" />
                  الرسام
                </Badge>
              )}
              {!isDrawer && (
                <Badge
                  data-testid={`guesser-badge-${player.id}`}
                  className="w-full justify-center"
                  variant="secondary"
                >
                  <Eye className="w-3 h-3 ml-1" />
                  المخمّن
                </Badge>
              )}
            </div>
          );
        })}

        <div className="pt-3 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            الهدف: 5 نقاط للفوز 🎯
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
