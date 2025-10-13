# No Helmet Game

*Project vibe coded by Amazon Q and Specify (Spec Kit by GitHub)*

A maze game where the Labour character must navigate through a maze with misleading fake paths to find the helmet and win.

## Features

- **Complex Maze**: BFS-evaluated maze generation with 25-35 fake dead-end paths
- **Wall Constraint**: Helmet position guaranteed to never have walls
- **Emoji Graphics**: Uses 🚧 walls, 👨🏻🔧 labour character, and 🪖 helmet
- **30-Second Timer**: Race against time to find the helmet
- **WASD Controls**: Move Labour character up (W), down (S), left (A), right (D)
- **Victory Condition**: Reach the helmet at bottom right before time expires
- **NES.css Styling**: Retro 8-bit aesthetic with pixel-perfect fonts

## Setup

**Run the Game**:
- Open `src/index.html` in a web browser
- Game uses emoji graphics and NES.css (no external assets required)

## Game Mechanics

- **Maze Generation**: Recursive backtracking with BFS complexity evaluation
- **Wall Constraint**: Helmet position at (size-2, size-2) never contains walls
- **Extensive Fake Paths**: 25-35 dead-end branches for maximum confusion
- **Single-Width Corridors**: All paths are exactly 1x1 unit wide
- **Fixed Helmet Position**: Always located at bottom right corner
- **Collision Detection**: Prevents movement through walls

## Controls

- **W** - Move up
- **S** - Move down  
- **A** - Move left
- **D** - Move right

## Technical Details

- **Language**: TypeScript compiled to vanilla JavaScript
- **Rendering**: HTML5 Canvas with emoji-based graphics
- **Styling**: NES.css for authentic retro 8-bit aesthetics
- **Dependencies**: NES.css and "Press Start 2P" font from CDN
- **Browser Support**: Modern browsers with Canvas API and emoji support

## Implementation Highlights

- **Wall Constraint Enforcement**: Maze generation ensures helmet position never has walls
- **BFS Accessibility Validation**: Guarantees helmet is always reachable
- **Extensive Fake Path System**: 25-35 misleading branches with 2-12 cell lengths
- **Single-Width Path Control**: All corridors exactly 1x1 unit for precise navigation
- **Retro UI**: NES.css containers, buttons, and typography for authentic feel
