import { Button } from "@/components/ui/button";
import { Copy, LogOut, Check } from "lucide-react";
import { useState } from "react";

interface GameHeaderProps {
  roomCode: string;
  onLeave: () => void;
}

export function GameHeader({ roomCode, onLeave }: GameHeaderProps) {
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            data-testid="button-leave-game"
            variant="ghost"
            size="sm"
            onClick={onLeave}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 ml-2" />
            مغادرة
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-left">
            <p className="text-xs text-muted-foreground">كود الغرفة</p>
            <p className="text-lg font-mono font-bold" data-testid="text-room-code">{roomCode}</p>
          </div>
          <Button
            data-testid="button-copy-room-code"
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="h-9 w-9"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
