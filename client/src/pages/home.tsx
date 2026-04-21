import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Paintbrush, Users } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mode, setMode] = useState<"menu" | "create" | "join">("menu");

  const handleCreateRoom = () => {
    if (playerName.trim()) {
      const newRoomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setLocation(`/game?room=${newRoomCode}&name=${encodeURIComponent(playerName)}&create=true`);
    }
  };

  const handleJoinRoom = () => {
    if (playerName.trim() && roomCode.trim()) {
      setLocation(`/game?room=${roomCode}&name=${encodeURIComponent(playerName)}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <Paintbrush className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            لعبة الرسم والتخمين
          </h1>
          <p className="text-muted-foreground text-lg">
            ارسم، خمّن، واربح!
          </p>
        </div>

        {mode === "menu" && (
          <Card className="border-2">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">ابدأ اللعب</CardTitle>
              <CardDescription className="text-center">
                اختر كيف تريد اللعب
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="player-name">اسم اللاعب</Label>
                <Input
                  id="player-name"
                  data-testid="input-player-name"
                  placeholder="أدخل اسمك"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="text-lg"
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <Button
                  data-testid="button-create-room"
                  size="lg"
                  onClick={() => setMode("create")}
                  disabled={!playerName.trim()}
                  className="w-full text-lg h-12"
                >
                  <Users className="ml-2 h-5 w-5" />
                  إنشاء غرفة جديدة
                </Button>
                <Button
                  data-testid="button-join-room"
                  size="lg"
                  variant="outline"
                  onClick={() => setMode("join")}
                  disabled={!playerName.trim()}
                  className="w-full text-lg h-12"
                >
                  انضم لغرفة
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {mode === "create" && (
          <Card className="border-2">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">إنشاء غرفة جديدة</CardTitle>
              <CardDescription className="text-center">
                ستحصل على كود للغرفة لمشاركته مع صديقك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground mb-1">اسم اللاعب</p>
                <p className="text-xl font-bold text-foreground">{playerName}</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  data-testid="button-confirm-create"
                  onClick={handleCreateRoom}
                  className="flex-1 text-lg h-12"
                  size="lg"
                >
                  إنشاء الغرفة
                </Button>
                <Button
                  data-testid="button-back-from-create"
                  variant="outline"
                  onClick={() => setMode("menu")}
                  className="text-lg h-12"
                  size="lg"
                >
                  رجوع
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {mode === "join" && (
          <Card className="border-2">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">الانضمام لغرفة</CardTitle>
              <CardDescription className="text-center">
                أدخل كود الغرفة المكون من 6 أرقام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="room-code">كود الغرفة</Label>
                <Input
                  id="room-code"
                  data-testid="input-room-code"
                  placeholder="123456"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-2xl text-center font-mono tracking-wider"
                  maxLength={6}
                  dir="ltr"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  data-testid="button-confirm-join"
                  onClick={handleJoinRoom}
                  disabled={roomCode.length !== 6}
                  className="flex-1 text-lg h-12"
                  size="lg"
                >
                  انضم
                </Button>
                <Button
                  data-testid="button-back-from-join"
                  variant="outline"
                  onClick={() => setMode("menu")}
                  className="text-lg h-12"
                  size="lg"
                >
                  رجوع
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>أول لاعب يصل إلى 5 نقاط يفوز 🏆</p>
        </div>
      </div>
    </div>
  );
}
