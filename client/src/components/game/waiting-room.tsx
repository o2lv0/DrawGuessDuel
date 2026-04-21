import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Users, Clock } from "lucide-react";
import { useState } from "react";

interface WaitingRoomProps {
  roomCode: string;
  playerName: string;
  onLeave: () => void;
}

export function WaitingRoom({ roomCode, playerName, onLeave }: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Clock className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-2xl">في انتظار اللاعب الثاني...</CardTitle>
          <CardDescription>شارك كود الغرفة مع صديقك للانضمام</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">كود الغرفة</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-4xl font-mono font-bold tracking-wider" data-testid="text-waiting-room-code">
                  {roomCode}
                </p>
                <Button
                  data-testid="button-copy-code-waiting"
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="h-10 w-10"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">اللاعبون الحاليون</p>
                  <p className="font-semibold" data-testid="text-current-player">{playerName}</p>
                </div>
                <div className="text-2xl font-bold text-primary">1/2</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              في انتظار انضمام لاعب آخر...
            </div>
            <p className="text-xs text-muted-foreground text-center pt-2 border-t">
              ستبدأ اللعبة تلقائياً عند انضمام اللاعب الثاني
            </p>
          </div>

          <Button
            data-testid="button-leave-waiting"
            variant="outline"
            onClick={onLeave}
            className="w-full"
          >
            مغادرة الغرفة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
