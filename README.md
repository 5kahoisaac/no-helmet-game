# No Helmet Game

*Project vibe coded by Amazon Q and Specify (Spec Kit by GitHub)*

A maze game where the Labour character must navigate through a maze with misleading fake paths to find the helmet and win.

## Features

- **Complex Maze**: BFS-evaluated maze generation with 25-35 fake dead-end paths
- **Emoji Graphics**: Uses 🚧 walls, 👨🏻🔧 labour character, and 🪖 helmet
- **30-Second Timer**: Race against time to find the helmet
- **WASD Controls**: Move Labour character up (W), down (S), left (A), right (D)
- **Victory Condition**: Reach the helmet at bottom right before time expires

## Setup

**Run the Game**:
- Open `src/index.html` in a web browser
- Game uses emoji graphics (no external assets required)

## Game Mechanics

- **Maze Generation**: Recursive backtracking with BFS complexity evaluation
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
- **Dependencies**: Minimal - only TypeScript for development
- **Browser Support**: Modern browsers with Canvas API and emoji support
