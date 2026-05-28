enum GameState {
  WAITING = 'waiting',
  PLAYING = 'playing',
  WON = 'won',
  LOST = 'lost'
}

enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right'
}

interface Position {
  readonly x: number;
  readonly y: number;
}

interface GameStats {
  completionTime: number;
  pathEfficiency: number;
  totalMoves: number;
  optimalMoves: number;
  score: number;
}

class Timer {
  duration: number = 30;
  remaining: number = 30;
  active: boolean = false;
  precision: number = 100;
  startTime: number = 0;
  onExpired: () => void;
  onWarning: (seconds: number) => void;
  intervalId: any = null;

  constructor(onExpired: () => void, onWarning: (seconds: number) => void) {
    this.onExpired = onExpired;
    this.onWarning = onWarning;
  }

  start(): void {
    if (this.active) return;
    this.active = true;
    this.startTime = Date.now();
    this.intervalId = setInterval(() => this.update(), this.precision);
  }

  update(): void {
    if (!this.active) return;
    
    const elapsed = (Date.now() - this.startTime) / 1000;
    this.remaining = Math.max(0, this.duration - elapsed);
    
    // Update timer display immediately in timer update cycle
    const timerEl = document.getElementById('timer')!;
    timerEl.textContent = `Time: ${Math.ceil(this.remaining)}s`;
    
    if (this.remaining <= 0) {
      this.stop();
      this.onExpired();
      return;
    }
    
    // Eliminate special cases - data-driven approach
    const warnings = [10, 5, 3];
    const currentSecond = Math.ceil(this.remaining);
    
    if (warnings.includes(currentSecond) && 
        Math.ceil(this.remaining + this.precision / 1000) > currentSecond) {
      this.onWarning(currentSecond);
    }
  }

  stop(): void {
    this.active = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  isExpired(): boolean {
    return this.remaining <= 0;
  }

  getElapsedTime(): number {
    if (this.startTime === 0) return 0;
    return this.active ? (Date.now() - this.startTime) / 1000 : this.duration - this.remaining;
  }

  reset(): void {
    this.stop();
    this.remaining = this.duration;
    this.startTime = 0;
  }
}

class Labour {
  position: Position;
  moveHistory: Position[] = [];
  totalMoves: number = 0;
  isSlowed: boolean = false;
  slowEndTime: number = 0;

  constructor(startX: number, startY: number) {
    this.position = { x: startX, y: startY };
    this.moveHistory.push({ ...this.position });
  }

  move(direction: Direction): void {
    if (this.isSlowed && Date.now() < this.slowEndTime) return;
    
    this.isSlowed = false;
    const newPos = { ...this.position };
    
    switch (direction) {
      case Direction.UP: newPos.y--; break;
      case Direction.DOWN: newPos.y++; break;
      case Direction.LEFT: newPos.x--; break;
      case Direction.RIGHT: newPos.x++; break;
    }
    
    this.position = newPos;
    this.moveHistory.push({ ...this.position });
    this.totalMoves++;
  }

  isAtPosition(pos: Position): boolean {
    return this.position.x === pos.x && this.position.y === pos.y;
  }

  calculatePathEfficiency(optimalPath: Position[]): number {
    return this.totalMoves > 0 ? optimalPath.length / this.totalMoves : 0;
  }

  reset(startX: number, startY: number): void {
    this.position = { x: startX, y: startY };
    this.moveHistory = [{ ...this.position }];
    this.totalMoves = 0;
    this.isSlowed = false;
    this.slowEndTime = 0;
  }

  applySlowEffect(): void {
    this.isSlowed = true;
    this.slowEndTime = Date.now() + 2000;
  }
}

class Maze {
  grid: number[][] = [];
  size: number = 30;
  startPosition: Position = { x: 1, y: 1 };
  helmetPosition: Position;
  trapCells: Position[] = [];
  checkpoints: Position[] = [];

  constructor() {
    this.helmetPosition = { x: this.size - 2, y: this.size - 2 };
    this.generate();
  }

  generate(): void {
    this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(1));
    
    // Recursive backtracking maze generation
    this.recursiveBacktrack(1, 1);
    
    // Ensure helmet position is always open
    this.grid[this.helmetPosition.y][this.helmetPosition.x] = 0;
    
    // Add extensive fake paths
    this.addExtensiveFakePaths();
    
    // Validate accessibility
    if (!this.validateHelmetAccessibility()) {
      this.generate(); // Regenerate if not accessible
    }
  }

  recursiveBacktrack(x: number, y: number): void {
    this.grid[y][x] = 0;
    
    const directions = [
      { dx: 0, dy: -2 }, { dx: 2, dy: 0 }, { dx: 0, dy: 2 }, { dx: -2, dy: 0 }
    ];
    
    // Shuffle directions
    for (let i = directions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [directions[i], directions[j]] = [directions[j], directions[i]];
    }
    
    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      
      if (nx > 0 && nx < this.size - 1 && ny > 0 && ny < this.size - 1 && this.grid[ny][nx] === 1) {
        this.grid[y + dir.dy / 2][x + dir.dx / 2] = 0;
        this.recursiveBacktrack(nx, ny);
      }
    }
  }

  addExtensiveFakePaths(): void {
    const fakePathCount = 35 + Math.floor(Math.random() * 16); // 35-50 fake paths
    
    for (let i = 0; i < fakePathCount; i++) {
      this.createFakePath();
    }
  }

  createFakePath(): void {
    const pathLength = 3 + Math.floor(Math.random() * 13); // 3-15 cells
    let x = 1 + Math.floor(Math.random() * (this.size - 2));
    let y = 1 + Math.floor(Math.random() * (this.size - 2));
    
    if (this.grid[y][x] !== 0) return;
    
    for (let i = 0; i < pathLength; i++) {
      const directions = [
        { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
      ];
      
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      
      if (nx > 0 && nx < this.size - 1 && ny > 0 && ny < this.size - 1) {
        this.grid[ny][nx] = 0;
        x = nx;
        y = ny;
      }
    }
  }

  validateHelmetAccessibility(): boolean {
    const visited = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
    const queue: Position[] = [this.startPosition];
    visited[this.startPosition.y][this.startPosition.x] = true;
    
    while (queue.length > 0) {
      const pos = queue.shift()!;
      
      if (pos.x === this.helmetPosition.x && pos.y === this.helmetPosition.y) {
        return true;
      }
      
      const directions = [
        { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
      ];
      
      for (const dir of directions) {
        const nx = pos.x + dir.dx;
        const ny = pos.y + dir.dy;
        
        if (this.isValidMove({ x: nx, y: ny }) && !visited[ny][nx]) {
          visited[ny][nx] = true;
          queue.push({ x: nx, y: ny });
        }
      }
    }
    
    return false;
  }

  isValidMove(position: Position): boolean {
    return position.x >= 0 && position.x < this.size && 
           position.y >= 0 && position.y < this.size && 
           this.grid[position.y][position.x] === 0;
  }

  isPath(position: Position): boolean {
    return this.isValidMove(position);
  }

  isTrapCell(position: Position): boolean {
    return this.trapCells.some(trap => trap.x === position.x && trap.y === position.y);
  }

  isCheckpoint(position: Position): boolean {
    return this.checkpoints.some(cp => cp.x === position.x && cp.y === position.y);
  }
}

class Game {
  labour: Labour;
  maze: Maze;
  timer: Timer;
  gameState: GameState = GameState.WAITING;
  stats: GameStats;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cellSize: number = 20;
  inputBlocked: boolean = false;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    
    this.maze = new Maze();
    this.labour = new Labour(this.maze.startPosition.x, this.maze.startPosition.y);
    this.timer = new Timer(
      () => this.onTimerExpired(),
      (seconds) => this.onWarning(seconds)
    );
    
    this.stats = {
      completionTime: 0,
      pathEfficiency: 0,
      totalMoves: 0,
      optimalMoves: 0,
      score: 0
    };
    
    this.setupEventListeners();
    this.render();
  }

  private eventListeners: (() => void)[] = [];

  setupEventListeners(): void {
    const keydownHandler = (e: KeyboardEvent) => {
      if (this.inputBlocked) return;
      
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        e.preventDefault();
        this.handleInput(key);
      }
    };
    
    const retryHandler = () => this.restart();
    
    document.addEventListener('keydown', keydownHandler);
    const retryBtn = document.getElementById('retry-btn') as HTMLButtonElement;
    retryBtn.addEventListener('click', retryHandler);
    
    // Track cleanup functions
    this.eventListeners.push(
      () => document.removeEventListener('keydown', keydownHandler),
      () => retryBtn.removeEventListener('click', retryHandler)
    );
  }

  cleanup(): void {
    this.eventListeners.forEach(cleanup => cleanup());
    this.eventListeners = [];
    this.timer.stop();
  }

  handleInput(key: string): void {
    if (this.gameState === GameState.WAITING) {
      this.gameState = GameState.PLAYING;
      this.timer.start();
      this.clearCanvasBlur();
    }
    
    if (this.gameState !== GameState.PLAYING) return;
    
    const oldPos = { ...this.labour.position };
    let direction: Direction;
    
    switch (key) {
      case 'w': direction = Direction.UP; break;
      case 's': direction = Direction.DOWN; break;
      case 'a': direction = Direction.LEFT; break;
      case 'd': direction = Direction.RIGHT; break;
      default: return;
    }
    
    this.labour.move(direction);
    
    if (!this.maze.isValidMove(this.labour.position)) {
      this.labour.position = oldPos;
      this.labour.totalMoves--;
      this.labour.moveHistory.pop();
      return;
    }
    
    if (this.maze.isTrapCell(this.labour.position)) {
      this.labour.applySlowEffect();
    }
    
    if (this.checkHelmetTouch()) {
      this.gameState = GameState.WON;
      this.stats.completionTime = this.timer.getElapsedTime();
      this.timer.stop();
      this.calculateScore();
      this.showResult();
      this.blockInput();
    }
    
    this.render();
  }

  checkHelmetTouch(): boolean {
    return this.labour.isAtPosition(this.maze.helmetPosition);
  }

  onTimerExpired(): void {
    this.gameState = GameState.LOST;
    this.showResult();
    this.blockInput();
  }

  onWarning(seconds: number): void {
    const timerEl = document.getElementById('timer')!;
    timerEl.style.color = seconds <= 5 ? '#ff0000' : '#ff6600';
  }

  blockInput(): void {
    this.inputBlocked = true;
  }

  showResult(): void {
    const statusEl = document.getElementById('status')!;
    const retryBtn = document.getElementById('retry-btn')!;
    
    if (this.gameState === GameState.WON) {
      statusEl.textContent = `Victory! You found the helmet in ${this.stats.completionTime.toFixed(1)}s!\nScore: ${this.stats.score}`;
    } else {
      statusEl.textContent = 'No Helmet\nTime expired! Try again to find the helmet.';
    }
    
    retryBtn.style.display = 'block';
  }

  calculateScore(): number {
    // completionTime already stored before timer.stop()
    this.stats.totalMoves = this.labour.totalMoves;
    this.stats.optimalMoves = this.calculateOptimalPath().length;
    this.stats.pathEfficiency = this.labour.calculatePathEfficiency(this.calculateOptimalPath());
    
    const timeBonus = Math.max(0, 30 - this.stats.completionTime) * 10;
    const efficiencyBonus = this.stats.pathEfficiency * 100;
    this.stats.score = Math.round(timeBonus + efficiencyBonus);
    
    return this.stats.score;
  }

  calculateOptimalPath(): Position[] {
    const visited = Array(this.maze.size).fill(null).map(() => Array(this.maze.size).fill(false));
    const queue: { pos: Position; path: Position[] }[] = [
      { pos: this.maze.startPosition, path: [this.maze.startPosition] }
    ];
    visited[this.maze.startPosition.y][this.maze.startPosition.x] = true;
    
    while (queue.length > 0) {
      const { pos, path } = queue.shift()!;
      
      if (pos.x === this.maze.helmetPosition.x && pos.y === this.maze.helmetPosition.y) {
        return path;
      }
      
      const directions = [
        { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
      ];
      
      for (const dir of directions) {
        const nx = pos.x + dir.dx;
        const ny = pos.y + dir.dy;
        const newPos = { x: nx, y: ny };
        
        if (this.maze.isValidMove(newPos) && !visited[ny][nx]) {
          visited[ny][nx] = true;
          queue.push({ pos: newPos, path: [...path, newPos] });
        }
      }
    }
    
    return [];
  }

  clearCanvasBlur(): void {
    this.canvas.classList.add('game-started');
  }

  restart(): void {
    this.cleanup();
    
    this.gameState = GameState.WAITING;
    this.inputBlocked = false;
    this.timer.reset();
    this.maze = new Maze();
    this.labour.reset(this.maze.startPosition.x, this.maze.startPosition.y);
    
    this.stats = {
      completionTime: 0,
      pathEfficiency: 0,
      totalMoves: 0,
      optimalMoves: 0,
      score: 0
    };
    
    const statusEl = document.getElementById('status')!;
    const retryBtn = document.getElementById('retry-btn')!;
    const timerEl = document.getElementById('timer')!;
    
    statusEl.textContent = 'Press WASD to start! Find the helmet in 30 seconds!';
    retryBtn.style.display = 'none';
    timerEl.style.color = '';
    this.canvas.classList.remove('game-started');
    
    this.setupEventListeners();
    this.render();
  }

  render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.font = `${this.cellSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Render maze
    for (let y = 0; y < this.maze.size; y++) {
      for (let x = 0; x < this.maze.size; x++) {
        const cellX = x * this.cellSize;
        const cellY = y * this.cellSize;
        
        if (this.maze.grid[y][x] === 1) {
          this.ctx.fillText('🚧', cellX + this.cellSize / 2, cellY + this.cellSize / 2);
        }
      }
    }
    
    // Render helmet
    const helmetX = this.maze.helmetPosition.x * this.cellSize;
    const helmetY = this.maze.helmetPosition.y * this.cellSize;
    this.ctx.fillText('🪖', helmetX + this.cellSize / 2, helmetY + this.cellSize / 2);
    
    // Render labour
    const labourX = this.labour.position.x * this.cellSize;
    const labourY = this.labour.position.y * this.cellSize;
    const labourEmoji = this.gameState === 'won' ? '👷🏻‍♂️' : '👨🏻‍🔧';
    this.ctx.fillText(labourEmoji, labourX + this.cellSize / 2, labourY + this.cellSize / 2);
  }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Game();
});
