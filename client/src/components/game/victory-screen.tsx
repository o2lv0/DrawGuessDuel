import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Home, RotateCcw } from "lucide-react";
import type { Player } from "@shared/schema";

interface VictoryScreenProps {
  winnerName: string;
  isWinner: boolean;
  players: Player[];
  onPlayAgain: () => void;
  onLeave: () => void;
}

export function VictoryScreen({ winnerName, isWinner, players, onPlayAgain, onLeave }: VictoryScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="w-full max-w-lg space-y-4">
        {/* Victory Card */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader className="text-center space-y-4 pb-4">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center animate-bounce">
              <Trophy className="w-14 h-14 text-white" />
            </div>
            <div>
              <CardTitle className="text-4xl mb-2">
                {isWinner ? "مبروك! فزت! 🎉" : "انتهت اللعبة"}
              </CardTitle>
              <CardDescription className="text-xl">
                {isWinner ? (
                  <span className="text-primary font-semibold">
                    {players.length < 2 ? "اللاعب الآخر غادر" : "أنت الفائز!"}
                  </span>
                ) : (
                  <span>الفائز: <span className="text-primary font-semibold">{winnerName}</span></span>
                )}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Final Scores */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground text-center mb-3">
                النتيجة النهائية
              </h3>
              {players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div
                    key={player.id}
                    data-testid={`final-score-${player.id}`}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index === 0
                        ? "bg-primary/10 border-2 border-primary/30"
                        : "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {index === 0 && (
                        <Trophy className="w-5 h-5 text-yellow-500" />
                      )}
                      <span className={`font-semibold ${
                        index === 0 ? "text-primary" : "text-foreground"
                      }`}>
                        {player.name}
                      </span>
                    </div>
                    <span className="text-2xl font-bold" data-testid={`final-score-value-${player.id}`}>
                      {player.score}
                    </span>
                  </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-2 pt-2">
              <Button
                data-testid="button-play-again"
                size="lg"
                onClick={onPlayAgain}
                className="w-full text-lg h-12"
              >
                <RotateCcw className="w-5 h-5 ml-2" />
                لعب مرة أخرى
              </Button>
              <Button
                data-testid="button-leave-victory"
                variant="outline"
                size="lg"
                onClick={onLeave}
                className="w-full text-lg h-12"
              >
                <Home className="w-5 h-5 ml-2" />
                العودة للقائمة الرئيسية
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Fun Message */}
        <p className="text-center text-sm text-muted-foreground">
          {isWinner ? "أحسنت! رسم رائع وتخمين ذكي 🎨" : "حاول مرة أخرى! 💪"}
        </p>
      </div>
    </div>
  );
}
