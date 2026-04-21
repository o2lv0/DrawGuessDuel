# Design Guidelines: لعبة الرسم والتخمين (Drawing & Guessing Game)

## Design Approach

**Reference-Based Gaming Experience**
Drawing inspiration from successful multiplayer drawing games like Skribbl.io and interactive gaming platforms like Kahoot, with emphasis on:
- Immediate visual feedback and game state clarity
- Playful yet functional interface that encourages engagement
- Clear role differentiation between drawer and guesser
- Celebration of achievements and progress

**Core Principle:** Create an exciting, easy-to-understand gaming experience where players instantly know their role, see real-time updates, and feel rewarded for successful guesses.

## RTL (Right-to-Left) Arabic Implementation

- All text, navigation, and interface elements flow RTL
- Canvas controls positioned on right side for natural Arabic flow
- Room code input and joining flows align right
- Score displays with Arabic numerals (or Eastern Arabic numerals as preference)
- Button arrangements and card layouts mirror for RTL consistency

## Typography Hierarchy

**Arabic Font Families:**
- Primary: 'Cairo' or 'Tajawal' for headings and UI elements (bold, modern Arabic typeface)
- Secondary: 'IBM Plex Sans Arabic' for body text and descriptions
- Monospace: 'Courier New' for room codes (language-neutral)

**Type Scale:**
- Game Title/Welcome: 3xl to 5xl (bold)
- Room Code Display: 2xl to 3xl (prominent, easy to read)
- Current Word (Drawer): xl to 2xl (clear but not overwhelming)
- Player Names/Roles: lg to xl (medium weight)
- Scores: 2xl to 3xl (bold, celebratory)
- Guessing Input: lg (comfortable reading)
- Buttons/CTAs: base to lg (clear, actionable)
- Helper Text: sm to base (supportive)

## Layout System

**Spacing Foundation:**
Tailwind units: 2, 4, 6, 8, 12, 16, 24 for consistent rhythm
- Tight spacing (2-4): Between related elements, icon padding
- Standard spacing (6-8): Component internal padding, button spacing
- Generous spacing (12-16): Section separation, canvas margins
- Large spacing (24): Major section breaks, game state transitions

**Screen Layouts:**

*Welcome/Join Screen:*
- Centered single-column layout (max-w-md)
- Room code input prominently placed
- Create/Join buttons stacked vertically on mobile, horizontal on desktop
- Quick instructions in collapsible section below

*Active Game Screen:*
- Three-zone layout on desktop: Left sidebar (20%) for scores/players, Center (60%) for canvas, Right sidebar (20%) for tools/chat
- Mobile: Stacked layout with fixed header (scores), full-width canvas, bottom sheet for tools
- Canvas maintains 4:3 or 16:9 aspect ratio, responsive scaling
- Fixed bottom section for guess input (always accessible)

## Component Library

### Navigation & Game State

**Header Bar:**
- Full-width sticky header showing room code, current round, timer (if applicable)
- Player indicators with clear "YOUR TURN" or "WAIT FOR GUESS" states
- Exit/Leave game button (top-left in RTL)

**Scoreboard Cards:**
- Two player cards displayed side-by-side or stacked
- Large score numbers with +/- animation feedback
- Current role badge: "الرسام" (Drawer) or "المخمّن" (Guesser) with distinct visual treatment
- Trophy/star icon for leading player
- Pulsing border or glow effect on active player's card

### Drawing Canvas Area

**Canvas Container:**
- Clean white drawing surface with subtle border
- Maintains aspect ratio across devices
- Canvas controls overlay on top-right (RTL): undo, clear, brush size
- Current word display for drawer (top of canvas, large text with background overlay)
- "Drawing in progress" indicator for guesser (centered, subtle)

**Color Palette Selector:**
- Horizontal row of 8+ color swatches (circular buttons)
- Active color has larger size + ring indicator
- Colors: أحمر (red), أزرق (blue), أخضر (green), أصفر (yellow), برتقالي (orange), بنفسجي (purple), أسود (black), بني (brown)
- Each swatch: 12-16 units diameter, 2-unit gap between
- Positioned below or beside canvas depending on viewport

**Brush Controls:**
- Slider for brush thickness (3 sizes: thin, medium, thick)
- Visual preview of current brush size
- Clear canvas button with confirmation (trash icon + Arabic label)

### Input & Interaction

**Guess Input Section:**
- Large text input field (full-width on mobile, max-w-lg on desktop)
- Placeholder: "اكتب تخمينك هنا" (Write your guess here)
- Single submit button: "تخمين" (Guess) with primary treatment
- One-shot submission: button disables after guess, shows loading state
- Auto-focus on guesser's turn

**Feedback Overlay:**
- Temporary full-screen overlay on guess submission
- Correct guess: Celebration animation with "صحيح! +1" (Correct! +1)
- Wrong guess: Encouraging message with "-1" (if score > 0) or "حاول مرة أخرى في الدور القادم" (Try again next turn)
- Auto-dismiss after 2-3 seconds, transitions to next turn

### Game Flow Components

**Room Creation Modal:**
- Centered modal (max-w-sm)
- Displays generated 6-digit room code in large, copyable format
- "Share this code" instruction with copy button
- Waiting indicator: "في انتظار اللاعب الثاني..." (Waiting for second player...)
- Auto-dismiss when second player joins

**Victory Screen:**
- Full-screen celebration overlay
- Winner announcement: "فوز [اسم اللاعب]!" (Player wins!)
- Final scores displayed prominently
- Action buttons: "لعب مرة أخرى" (Play Again), "مغادرة" (Leave)
- Confetti or celebratory animation (subtle, not overwhelming)

**Turn Transition:**
- Brief interstitial (1-2 seconds) between turns
- Shows next drawer and new word assignment
- Animated role swap indicator
- Countdown timer: "دورك سيبدأ في..." (Your turn starts in...)

## Visual Feedback Patterns

**Real-time Drawing Sync:**
- Smooth stroke rendering with no lag indicators
- Subtle cursor position dot for guesser (shows where drawer is drawing)
- Loading skeleton if connection delays

**Score Changes:**
- Animated number transitions (+1/-1 with slide/fade)
- Particle effects or brief glow on score increase
- Shake animation on score decrease

**Turn Indicators:**
- Active player card: Bright border, elevated shadow
- Inactive player: Dimmed opacity (60-70%)
- Role badges update with flip animation

**Connection Status:**
- Subtle indicator in header for WebSocket connection
- Reconnecting state: Overlay with "إعادة الاتصال..." (Reconnecting...)

## Responsive Breakpoints

**Mobile (< 768px):**
- Single column stacked layout
- Canvas full-width, 3:4 aspect ratio
- Color palette horizontal scroll below canvas
- Scoreboard collapsed to compact horizontal bar at top
- Guess input fixed at bottom

**Tablet (768px - 1024px):**
- Two-column: Sidebar (30%) + Canvas (70%)
- Color palette beside canvas
- Scoreboard in sidebar, always visible

**Desktop (> 1024px):**
- Three-zone layout as described
- Canvas maintains comfortable viewing size (max 800px width)
- All controls visible simultaneously

## Micro-interactions

- Button press: Scale down slightly (95%), quick bounce back
- Color selection: Scale up selected color (110%)
- Canvas clear: Brief fade-out before clearing
- Guess submission: Button ripple effect, then loading spinner
- Score update: Number pops and settles
- New word reveal: Text fades in with slight slide

## Accessibility

- High contrast between canvas and background
- Focus states on all interactive elements
- Keyboard navigation for color selection (arrow keys)
- Screen reader announcements for turn changes and score updates
- Touch targets minimum 44x44 pixels
- Form labels properly associated with inputs

## Images

**Welcome Screen Background:**
- Playful illustration of two people drawing/guessing (cartoon style)
- Positioned as background with overlay for text readability
- Not a hero image - subtle, supportive visual

**Empty State Graphics:**
- Small illustration when waiting for second player
- Victory screen: Trophy or celebration graphic (200x200px max)

No large hero sections needed - this is a functional game interface prioritizing gameplay area and controls.