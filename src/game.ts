interface Position {
  x: number;
  y: number;
}

type GameState = 'waiting' | 'playing' | 'won' | 'lost';

interface BFSComplexity {
  minDistance: number;
  maxDistance: number;
  difference: number;
}

class Timer {
  duration: number = 30;
  remaining: number = 30;
  active: boolean = false;
  intervalId: any = null;

  start() {
    this.active = true;
    this.remaining = this.duration;
    this.intervalId = setInterval(() => {
      this.remaining--;
      this.updateDisplay();
      if (this.remaining <= 0) {
        this.stop();
      }
    }, 1000);
    this.updateDisplay();
  }

  stop() {
    this.active = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset() {
    this.stop();
    this.remaining = this.duration;
    this.updateDisplay();
  }

  isExpired(): boolean {
    return this.remaining <= 0;
  }

  updateDisplay() {
    document.getElementById('timer')!.textContent = `Time: ${this.remaining}s`;
  }
}

class Maze {
  grid: number[][] = [];
  size: number = 31; // Odd size for proper maze generation
  cellSize: number = 19;
  start: Position = { x: 1, y: 1 };
  helmetPosition: Position = { x: 29, y: 29 }; // Fixed bottom right

  constructor() {
    this.generateValidMaze();
  }

  generateValidMaze() {
    let attempts = 0;
    let complexity: BFSComplexity;
    
    do {
      this.generate();
      complexity = this.evaluateBFSComplexity();
      attempts++;
    } while (complexity.difference < 15 && attempts < 30); // Minimum complexity threshold
  }

  generate() {
    // Initialize with walls
    this.grid = Array(this.size).fill(0).map(() => Array(this.size).fill(1));
    
    // Create single-width path network
    this.carvePassage(1, 1);
    
    // Add extensive fake paths (25-35 branches)
    this.addExtensiveFakePaths();
    
    // Ensure start and helmet positions are clear
    this.grid[this.start.y][this.start.x] = 0;
    this.grid[this.helmetPosition.y][this.helmetPosition.x] = 0;
    
    // Ensure single-width paths throughout
    this.ensureSingleWidthPaths();
  }

  carvePassage(x: number, y: number) {
    this.grid[y][x] = 0;
    const directions = [[0, 2], [2, 0], [0, -2], [-2, 0]].sort(() => Math.random() - 0.5);
    
    for (const [dx, dy] of directions) {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && nx < this.size - 1 && ny > 0 && ny < this.size - 1 && this.grid[ny][nx] === 1) {
        this.grid[y + dy / 2][x + dx / 2] = 0; // Single-width corridor
        this.carvePassage(nx, ny);
      }
    }
  }

  addExtensiveFakePaths() {
    // Add 25-35 extensive fake dead-end branches
    const fakePathCount = 25 + Math.floor(Math.random() * 11);
    
    for (let i = 0; i < fakePathCount; i++) {
      for (let attempts = 0; attempts < 200; attempts++) {
        const x = 2 + Math.floor(Math.random() * (this.size - 4));
        const y = 2 + Math.floor(Math.random() * (this.size - 4));
        
        if (this.grid[y][x] === 1 && this.hasAdjacentPath(x, y)) {
          // Variable length fake paths (2-12 cells deep) with single width
          const fakeLength = 2 + Math.floor(Math.random() * 11);
          this.carveFakePath(x, y, fakeLength);
          break;
        }
      }
    }
  }

  hasAdjacentPath(x: number, y: number): boolean {
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    return directions.some(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx >= 0 && nx < this.size && ny >= 0 && ny < this.size && this.grid[ny][nx] === 0;
    });
  }

  carveFakePath(x: number, y: number, length: number) {
    this.grid[y][x] = 0;
    if (length <= 0) return;
    
    // Single direction to maintain 1x1 width
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]].sort(() => Math.random() - 0.5);
    
    for (const [dx, dy] of directions) {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && nx < this.size - 1 && ny > 0 && ny < this.size - 1 && this.grid[ny][nx] === 1) {
        this.carveFakePath(nx, ny, length - 1);
        break; // Only one direction to maintain single width
      }
    }
  }

  ensureSingleWidthPaths() {
    // Validate and fix any paths wider than 1x1
    for (let y = 1; y < this.size - 1; y++) {
      for (let x = 1; x < this.size - 1; x++) {
        if (this.grid[y][x] === 0) {
          // Check for 2x2 open areas and block one cell to maintain single width
          if (this.grid[y][x + 1] === 0 && this.grid[y + 1][x] === 0 && this.grid[y + 1][x + 1] === 0) {
            // Block one corner to prevent wide areas
            if (Math.random() < 0.5) {
              this.grid[y + 1][x + 1] = 1;
            } else {
              this.grid[y][x + 1] = 1;
            }
          }
        }
      }
    }
  }

  evaluateBFSComplexity(): BFSComplexity {
    // Calculate shortest path distance (min)
    const minDistance = this.bfsDistance(this.start, this.helmetPosition);
    
    // Calculate longest path distance in maze (max)
    let maxDistance = 0;
    for (let y = 1; y < this.size - 1; y++) {
      for (let x = 1; x < this.size - 1; x++) {
        if (this.grid[y][x] === 0) {
          const distance = this.bfsDistance(this.start, { x, y });
          if (distance > maxDistance) {
            maxDistance = distance;
          }
        }
      }
    }
    
    return {
      minDistance,
      maxDistance,
      difference: maxDistance - minDistance
    };
  }

  bfsDistance(start: Position, target: Position): number {
    const queue: { pos: Position; distance: number }[] = [{ pos: start, distance: 0 }];
    const visited = new Set<string>();
    visited.add(`${start.x},${start.y}`);

    while (queue.length > 0) {
      const { pos, distance } = queue.shift()!;
      
      if (pos.x === target.x && pos.y === target.y) {
        return distance;
      }

      const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
      for (const [dx, dy] of directions) {
        const nx = pos.x + dx;
        const ny = pos.y + dy;
        const key = `${nx},${ny}`;

        if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size && 
            !this.grid[ny][nx] && !visited.has(key)) {
          visited.add(key);
          queue.push({ pos: { x: nx, y: ny }, distance: distance + 1 });
        }
      }
    }
    
    return -1; // Target not reachable
  }

  validateHelmetAccessibility(): boolean {
    return this.bfsDistance(this.start, this.helmetPosition) !== -1;
  }

  isWall(x: number, y: number): boolean {
    return this.grid[y]?.[x] === 1;
  }

  isPath(x: number, y: number): boolean {
    return this.grid[y]?.[x] === 0;
  }
}

class Labour {
  position: Position = { x: 1, y: 1 };

  move(direction: string, maze: Maze): boolean {
    const newPos = { ...this.position };
    
    switch (direction) {
      case 'w': newPos.y--; break;
      case 's': newPos.y++; break;
      case 'a': newPos.x--; break;
      case 'd': newPos.x++; break;
    }

    if (!maze.isWall(newPos.x, newPos.y)) {
      this.position = newPos;
      return true;
    }
    return false;
  }

  isAtPosition(pos: Position): boolean {
    return this.position.x === pos.x && this.position.y === pos.y;
  }

  reset() {
    this.position = { x: 1, y: 1 };
  }
}

class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  maze: Maze;
  labour: Labour;
  timer: Timer;
  gameState: GameState = 'waiting';

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.width = 600;
    this.canvas.height = 600;
    
    this.maze = new Maze();
    this.labour = new Labour();
    this.timer = new Timer();
    
    this.setupInput();
    this.setupRetryButton();
    this.gameLoop();
  }

  setupInput() {
    document.addEventListener('keydown', (e) => {
      if (this.gameState !== 'waiting' && this.gameState !== 'playing') return;
      
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        if (this.gameState === 'waiting') {
          this.startGame();
        }
        
        if (this.gameState === 'playing') {
          this.labour.move(key, this.maze);
          this.checkHelmetTouch();
        }
      }
    });
  }

  setupRetryButton() {
    document.getElementById('retry-btn')!.addEventListener('click', () => {
      this.restart();
    });
  }

  startGame() {
    this.gameState = 'playing';
    this.timer.start();
    document.getElementById('status')!.textContent = 'Find the helmet 🪖 at bottom right before time runs out!';
  }

  checkHelmetTouch() {
    if (this.labour.isAtPosition(this.maze.helmetPosition)) {
      this.gameState = 'won';
      this.timer.stop();
      document.getElementById('status')!.textContent = '🎉 You got the Helmet! You won!';
      this.showRetryButton();
    }
  }

  checkTimeExpired() {
    if (this.timer.isExpired() && this.gameState === 'playing') {
      this.gameState = 'lost';
      document.getElementById('status')!.textContent = '⏰ No Helmet! Time\'s up!';
      this.showRetryButton();
    }
  }

  showRetryButton() {
    document.getElementById('retry-btn')!.style.display = 'block';
  }

  restart() {
    this.gameState = 'waiting';
    this.maze = new Maze(); // Generate new BFS-evaluated maze with fixed helmet
    this.labour.reset();
    this.timer.reset();
    document.getElementById('status')!.textContent = 'Press WASD to start! Find the helmet 🪖 in 30 seconds!';
    document.getElementById('retry-btn')!.style.display = 'none';
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw maze
    for (let y = 0; y < this.maze.size; y++) {
      for (let x = 0; x < this.maze.size; x++) {
        const px = x * this.maze.cellSize;
        const py = y * this.maze.cellSize;
        
        if (this.maze.grid[y][x] === 1) {
          // Draw wall emoji
          this.ctx.font = `${this.maze.cellSize - 2}px Arial`;
          this.ctx.textAlign = 'center';
          this.ctx.fillText('🚧', px + this.maze.cellSize / 2, py + this.maze.cellSize - 2);
        } else {
          // Draw path
          this.ctx.fillStyle = '#111';
          this.ctx.fillRect(px, py, this.maze.cellSize, this.maze.cellSize);
        }
      }
    }

    // Draw helmet at fixed bottom right position
    const fx = this.maze.helmetPosition.x * this.maze.cellSize;
    const fy = this.maze.helmetPosition.y * this.maze.cellSize;
    this.ctx.font = `${this.maze.cellSize - 2}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🪖', fx + this.maze.cellSize / 2, fy + this.maze.cellSize - 2);

    // Draw labour
    const lx = this.labour.position.x * this.maze.cellSize;
    const ly = this.labour.position.y * this.maze.cellSize;
    const labourEmoji = this.gameState === 'won' ? '👷🏻‍♂️' : '👨🏻‍🔧';
    this.ctx.fillText(labourEmoji, lx + this.maze.cellSize / 2, ly + this.maze.cellSize - 2);
  }

  gameLoop() {
    this.checkTimeExpired();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }
}

new Game();
