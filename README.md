# No Helmet Game

*Project vibe coded by Amazon Q and Specify (Spec Kit by GitHub)*

A maze game where the Labour character must navigate through a maze with misleading fake paths to find the helmet and win.

## Features

- **Misleading Maze**: Random maze generation with 8-12 fake dead-end paths to challenge players
- **Asset Support**: Sprite-based rendering with fallback to colored rectangles
- **WASD Controls**: Move Labour character up (W), down (S), left (A), right (D)
- **Victory Condition**: Reach the helmet to win the game

## Setup

1. **Download Assets** from https://itch.io/game-assets/tag-2d:
   - `wall.png` - Stone/brick wall texture (16x16 or 32x32 pixels)
   - `labour.png` - Worker/miner character sprite
   - `helmet.png` - Golden helmet icon

2. **Place Assets** in `/assets/sprites/` directory:
   ```
   assets/
   └── sprites/
       ├── wall.png
       ├── labour.png
       └── helmet.png
   ```

3. **Run the Game**:
   - Open `src/index.html` in a web browser
   - Assets will load automatically with fallback rendering if missing

## Game Mechanics

- **Maze Generation**: Uses recursive backtracking for the main solution path
- **Fake Paths**: Adds multiple dead-end branches to mislead players
- **Collision Detection**: Prevents movement through walls
- **Asset Loading**: Graceful fallback to colored shapes if sprites fail to load

## Controls

- **W** - Move up
- **S** - Move down  
- **A** - Move left
- **D** - Move right

## Technical Details

- **Language**: TypeScript compiled to vanilla JavaScript
- **Rendering**: HTML5 Canvas with pixel-perfect sprite rendering
- **Dependencies**: Minimal - only TypeScript for development
- **Browser Support**: Modern browsers with Canvas API support
