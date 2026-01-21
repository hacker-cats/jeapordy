# Jeopardy Game - Project Plan

## Project Overview
A static Jeopardy-style game deployed on GitHub Pages with no backend. Uses JavaScript for functionality and browser storage for persistence.

## Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: localStorage for game state persistence
- **File Format**: YAML/JSON for game configuration
- **Deployment**: GitHub Pages (static hosting)

## Core Features

### 1. Game Configuration File Format
```yaml
# Example game configuration
title: "Sample Jeopardy Game"
categories:
  - name: "Category 1"
    questions:
      - value: 200
        question: "Question text"
        answer: "Answer text"
      - value: 400
        question: "Question text"
        answer: "Answer text"
        dailyDouble: true
      # ... more questions
  - name: "Category 2"
    questions:
      # ... 5 questions per category

# Optional settings
settings:
  pointValues: [200, 400, 600, 800, 1000]
  doubleJeopardy: false
  allowNegativeScores: true
  timerSeconds: 30
```

### 2. Page Structure

#### A. Overview/Management Page (`index.html`)
**Features:**
- List of all stored games with status (new, in-progress, completed)
- Create new game button → opens file upload modal
- Resume game button for in-progress games
- Delete game button with confirmation
- Game cards showing: title, progress (X/Y questions answered), team scores

**UI Components:**
- File upload area (drag & drop or click to browse)
- YAML/JSON parser with error handling
- Game card grid layout
- Modal for game creation/upload

#### B. Game Board Page (`game.html`)
**Header:**
- Game title
- Team scores display
- Menu button
- Undo/Redo buttons

**Game Board:**
- Category headers (5-6 columns)
- Question grid (5 rows × 5-6 columns)
- Question values displayed on tiles
- Clicked/answered questions marked differently

**Question Modal:**
- Large question text
- Team buzz-in buttons
- Answer reveal button
- Correct/Incorrect buttons for each team
- Daily Double indicator and wager input
- Close/back button

**Side Panel/Menu:**
- Teams management
  - Add/remove teams
  - Edit team names
  - Team colors
  - Current scores
- Game settings
  - Timer on/off
  - Sound effects on/off
  - Show answers immediately
- Return to overview
- Undo/Redo history view

### 3. Customization Options
- **Number of teams**: 1-6 teams
- **Team names**: Editable text
- **Team colors**: Color picker or predefined palette
- **Point values**: Use default or custom values from config
- **Timer**: Enable/disable answer timer (default 30s)
- **Sound effects**: Toggle buzzer sounds and ding/wrong sounds
- **Negative scores**: Allow teams to go negative
- **Show answers**: Automatically show answer or require reveal
- **Double Jeopardy mode**: Doubles all point values

### 4. Game State Management

#### Local Storage Schema
```javascript
{
  games: [
    {
      id: "game-uuid-1",
      title: "Game Title",
      createdAt: "timestamp",
      lastPlayed: "timestamp",
      status: "new|in-progress|completed",
      config: { /* original game config */ },
      state: {
        currentQuestion: null,
        answeredQuestions: [/* array of question IDs */],
        teams: [
          { id: "team-1", name: "Team 1", color: "#ff0000", score: 0 }
        ],
        settings: { /* current game settings */ }
      },
      history: [
        {
          action: "answer-correct",
          timestamp: "timestamp",
          questionId: "cat1-q2",
          teamId: "team-1",
          pointChange: 400,
          previousState: { /* state snapshot */ }
        }
      ],
      historyIndex: 0 // for undo/redo
    }
  ]
}
```

### 5. Undo/Redo System
**History Tracking:**
- Each action creates a history entry with full state snapshot
- Actions: answer-correct, answer-incorrect, daily-double-wager, score-adjustment, team-add, team-remove
- History index tracks current position
- Undo: move index back, restore previous state
- Redo: move index forward, restore next state
- New actions clear any redo history ahead of current index

**UI:**
- Undo button (disabled if at start)
- Redo button (disabled if at end)
- Optional: history panel showing action list

### 6. Teams System
**Features:**
- Add team: creates new team with default name and random color
- Remove team: removes team from game (adds to history)
- Edit team: change name and color
- Score display: always visible, updates in real-time
- Buzz-in system: when question is open, any team can answer
- Scoring: correct answer adds points, incorrect subtracts points
- Daily Double: only the selecting team can answer, must wager first

**Team Management:**
- Minimum: 1 team (for single player)
- Maximum: 6 teams (UI constraint)
- Team state persisted with game

### 7. Daily Double Handling
- Daily Double questions marked in config with `dailyDouble: true`
- When selected, show "Daily Double!" animation
- Prompt team for wager:
  - Minimum: $5
  - Maximum: max(current score, highest question value remaining)
- Show question after wager
- Only the selecting team can answer
- Correct: add wager amount
- Incorrect: subtract wager amount

## File Structure
```
/
├── index.html              # Overview/management page
├── game.html               # Game board page
├── css/
│   ├── main.css           # Global styles
│   ├── overview.css       # Overview page styles
│   └── game.css           # Game board styles
├── js/
│   ├── storage.js         # localStorage wrapper
│   ├── gameState.js       # Game state management
│   ├── history.js         # Undo/redo system
│   ├── parser.js          # YAML/JSON parser
│   ├── overview.js        # Overview page logic
│   └── game.js            # Game board logic
├── lib/
│   └── js-yaml.min.js     # YAML parsing library
├── assets/
│   └── sounds/            # Sound effects (optional)
├── examples/
│   └── sample-game.yaml   # Example game file
├── GAME_PLAN.md           # This file
└── README.md              # User documentation
```

## Implementation Phases

### Phase 1: Core Structure
1. Set up project file structure
2. Create basic HTML pages (overview + game board)
3. Implement CSS for responsive layout
4. Set up localStorage wrapper

### Phase 2: File Upload & Parsing
1. Implement file upload UI
2. Add YAML/JSON parser (use js-yaml library)
3. Validate game configuration format
4. Create game instance in storage

### Phase 3: Overview Page
1. Display list of games from localStorage
2. Create/upload new game flow
3. Resume game navigation
4. Delete game with confirmation
5. Game cards with progress display

### Phase 4: Game Board Display
1. Render category headers
2. Render question grid
3. Style question tiles
4. Mark answered questions
5. Display team scores in header

### Phase 5: Game Logic
1. Question selection and modal display
2. Team buzz-in system
3. Answer reveal
4. Correct/incorrect scoring
5. Update game state

### Phase 6: Daily Double
1. Detect Daily Double questions
2. Show Daily Double animation
3. Wager input and validation
4. Special scoring logic

### Phase 7: History System
1. Create history entry on each action
2. Implement undo function
3. Implement redo function
4. History UI controls
5. State snapshot/restore

### Phase 8: Teams Management
1. Add/remove teams UI
2. Edit team names
3. Color picker
4. Team state persistence
5. Score display updates

### Phase 9: Settings & Polish
1. Settings panel/modal
2. Timer implementation
3. Sound effects (optional)
4. Customization options
5. Animations and transitions
6. Mobile responsive design

### Phase 10: Testing & Documentation
1. Test all game flows
2. Test undo/redo extensively
3. Test localStorage limits
4. Create example game files
5. Write README with instructions
6. Deploy to GitHub Pages

## Technical Considerations

### Browser Storage Limits
- localStorage typically limited to 5-10MB
- Store game state efficiently
- Limit history depth if needed (e.g., last 50 actions)
- Provide export/import for backup

### File Parsing
- Use js-yaml library for YAML support (https://github.com/nodeca/js-yaml)
- Native JSON.parse() for JSON
- Validate structure and required fields
- Provide helpful error messages

### State Management
- Single source of truth in localStorage
- Immutable state updates
- Deep clone for history snapshots
- Efficient diffing (only store changes if storage is limited)

### Mobile Support
- Responsive grid layout
- Touch-friendly buttons (min 44×44px)
- Readable text sizes
- Swipe gestures for navigation (optional)

### Accessibility
- Semantic HTML
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly

## Future Enhancements (Optional)
- Final Jeopardy round
- Import/export game state
- Multiple game boards per game file
- Animation customization
- Theme selection (classic, modern, dark mode)
- Buzzer sound customization
- Game statistics and history
- Share game files via URL parameters
- Print-friendly score sheet

## Success Criteria
- ✅ Upload and parse YAML/JSON game files
- ✅ Create, resume, and delete games
- ✅ Display game board with categories and questions
- ✅ Handle Daily Double with wagers
- ✅ Track multiple teams and scores
- ✅ Undo/redo functionality works correctly
- ✅ Game state persists across page refreshes
- ✅ Responsive design works on mobile and desktop
- ✅ No backend required, fully static deployment

## Timeline Estimate
- **Phase 1-3**: 4-6 hours (setup, parsing, overview)
- **Phase 4-6**: 6-8 hours (game board, logic, daily double)
- **Phase 7-8**: 4-6 hours (history, teams)
- **Phase 9-10**: 4-6 hours (polish, testing, docs)
- **Total**: 18-26 hours

## Getting Started
1. Review this plan
2. Set up Git repository
3. Create basic file structure
4. Begin Phase 1 implementation
5. Iterate and test frequently
