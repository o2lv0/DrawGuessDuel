import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface FeedbackOverlayProps {
  type: "correct" | "incorrect";
  message: string;
}

export function FeedbackOverlay({ type, message }: FeedbackOverlayProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [type, message]);

  if (!isVisible) return null;

  const isCorrect = type === "correct";

  return (
    <div
      data-testid="feedback-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className={`max-w-md w-full mx-4 p-8 rounded-2xl border-4 ${
          isCorrect
            ? "bg-green-50 dark:bg-green-950 border-green-500"
            : "bg-red-50 dark:bg-red-950 border-red-500"
        } animate-in zoom-in-95 duration-300`}
      >
        <div className="text-center space-y-4">
          {isCorrect ? (
            <CheckCircle2 className="w-20 h-20 mx-auto text-green-500 animate-bounce" />
          ) : (
            <XCircle className="w-20 h-20 mx-auto text-red-500 animate-pulse" />
          )}
          <div>
            <h2
              className={`text-4xl font-bold mb-2 ${
                isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
              }`}
              data-testid="feedback-title"
            >
              {isCorrect ? "صحيح! 🎉" : "خطأ"}
            </h2>
            <p
              className={`text-xl ${
                isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
              data-testid="feedback-message"
            >
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
