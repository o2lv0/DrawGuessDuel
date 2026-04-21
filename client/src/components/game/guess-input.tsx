import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send } from "lucide-react";

interface GuessInputProps {
  onSubmit: (guess: string) => void;
}

export function GuessInput({ onSubmit }: GuessInputProps) {
  const [guess, setGuess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim() && !isSubmitting) {
      setIsSubmitting(true);
      onSubmit(guess.trim());
      setGuess("");
      // Keep disabled for a moment to prevent double submission
      setTimeout(() => setIsSubmitting(false), 1000);
    }
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          data-testid="input-guess"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="اكتب تخمينك هنا..."
          className="flex-1 text-lg"
          dir="rtl"
          disabled={isSubmitting}
          autoFocus
        />
        <Button
          data-testid="button-submit-guess"
          type="submit"
          size="lg"
          disabled={!guess.trim() || isSubmitting}
          className="px-8"
        >
          {isSubmitting ? (
            <>
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent ml-2"></div>
              جاري الإرسال...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 ml-2" />
              تخمين
            </>
          )}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        لديك محاولة واحدة فقط • صحيح +1 • خطأ -1
      </p>
    </Card>
  );
}
