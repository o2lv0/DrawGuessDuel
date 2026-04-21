import OpenAI from "openai";

// Reference: javascript_openai blueprint
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function compareGuessWithWord(guess: string, targetWord: string): Promise<{
  correct: boolean;
  explanation: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `أنت حكم لعبة رسم وتخمين باللغة العربية. مهمتك هي تحديد ما إذا كان التخمين صحيحاً أم لا مقارنة بالكلمة الصحيحة.

قواعد المقارنة:
- التخمين صحيح إذا كان مطابقاً للكلمة الصحيحة
- التخمين صحيح إذا كان مرادفاً قريباً للكلمة الصحيحة
- يمكن التسامح مع الأخطاء الإملائية البسيطة
- التشكيل غير مهم (يمكن تجاهل الفتحة، الضمة، الكسرة، إلخ)

أجب بصيغة JSON مع الحقول التالية:
{
  "correct": true/false,
  "explanation": "تفسير قصير بالعربية"
}`,
        },
        {
          role: "user",
          content: `الكلمة الصحيحة: "${targetWord}"
التخمين: "${guess}"

هل التخمين صحيح؟`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      correct: result.correct === true,
      explanation: result.explanation || "",
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Fallback to simple string comparison
    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedTarget = targetWord.trim().toLowerCase();
    const isCorrect = normalizedGuess === normalizedTarget;
    
    return {
      correct: isCorrect,
      explanation: isCorrect ? "صحيح تماماً!" : "غير صحيح",
    };
  }
}
