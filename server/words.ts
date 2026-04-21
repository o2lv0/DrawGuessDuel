// Arabic word bank for the drawing game
// 20 nouns in 4 easy categories with 5 words each
export const ARABIC_WORDS = [
  // Animals - حيوانات (5 words)
  "قطة",     // cat
  "كلب",     // dog
  "حصان",    // horse
  "سمكة",    // fish
  "طائر",    // bird
  
  // Food - طعام (5 words)
  "تفاحة",   // apple
  "موزة",    // banana
  "خبز",     // bread
  "بيتزا",   // pizza
  "كعكة",    // cake
  
  // Objects - أشياء (5 words)
  "كتاب",    // book
  "قلم",     // pen
  "كرسي",    // chair
  "ساعة",    // clock
  "مفتاح",   // key
  
  // Nature - طبيعة (5 words)
  "شجرة",    // tree
  "زهرة",    // flower
  "شمس",     // sun
  "قمر",     // moon
  "نجمة",    // star
];

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get initial shuffled word list
export function getInitialWordList(): string[] {
  return shuffleArray(ARABIC_WORDS);
}

// Get next word from available words, reshuffle if needed
export function getNextWord(availableWords: string[]): { word: string; updatedAvailableWords: string[] } {
  // If no words available, reshuffle the entire list
  if (availableWords.length === 0) {
    availableWords = getInitialWordList();
  }
  
  // Take the first word and remove it from available words
  const word = availableWords[0];
  const updatedAvailableWords = availableWords.slice(1);
  
  return { word, updatedAvailableWords };
}
