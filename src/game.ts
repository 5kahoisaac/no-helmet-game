// Advanced interfaces for performance tracking
interface Position {
    x: number;
    y: number;
}

interface GameStats {
    completionTime: number;
    pathEfficiency: number;
    totalMoves: number;
    optimalMoves: number;
    score: number;
}

// Timer Class with automatic game end handling
class Timer {
    duration: number = 30;
    remaining: number = 30;
    active: boolean = false;
    precision: number = 100; // millisecond precision
    private intervalId: any = null;
    private startTime: number = 0;
    onExpired: (() => void) | null = null;

    start(): void {
        if (this.active) return;
        this.active = true;
        this.startTime = Date.now();
        this.intervalId = setInterval(() => {
            const elapsed = (Date.now() - this.startTime) / 1000;
            this.remaining = Math.max(0, this.duration - elapsed);
            this.updateDisplay();
            
            // Automatic game end handling
            if (this.remaining <= 0) {
                this.stop();
                if (this.onExpired) {
                    this.onExpired(); // Automatically trigger game end
                }
            }
        }, this.precision);
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.active = false;
    }

    reset(): void {
        this.stop();
        this.remaining = this.duration;
        this.updateDisplay();
    }

    isExpired(): boolean {
        return this.remaining <= 0;
    }

    getElapsedTime(): number {
        if (!this.active && this.startTime > 0) {
            return this.duration - this.remaining;
        }
        return this.active ? (Date.now() - this.startTime) / 1000 : 0;
    }

    private updateDisplay(): void {
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = `Time: ${this.remaining.toFixed(1)}s`;
            
            // Warning states
            if (this.remaining <= 3 && this.remaining > 0) {
                timerElement.style.color = '#ff4444';
            } else if (this.remaining <= 5) {
                timerElement.style.color = '#ffaa00';
            } else if (this.remaining <= 10) {
                timerElement.style.color = '#ffdd00';
            }
        }
    }
}

// Labour Class with move tracking
class Labour {
    position: Position;
    moveHistory: Position[] = [];
    totalMoves: number = 0;

    constructor(startX: number, startY: number) {
        this.position = {x: startX, y: startY};
        this.moveHistory = [{ x: startX, y: startY }];
    }

    move(direction: 'up' | 'down' | 'left' | 'right'): void {
        switch (direction) {
            case 'up':
                this.position.y--;
                break;
            case 'down':
                this.position.y++;
                break;
            case 'left':
                this.position.x--;
                break;
            case 'right':
                this.position.x++;
                break;
        }
        this.totalMoves++;
        this.moveHistory.push({ ...this.position });
    }

    isAtPosition(pos: Position): boolean {
        return this.position.x === pos.x && this.position.y === pos.y;
    }

    calculatePathEfficiency(optimalPath: Position[]): number {
        if (optimalPath.length === 0) return 0;
        return Math.min(1, optimalPath.length / this.totalMoves);
    }

    reset(startX: number, startY: number): void {
        this.position = {x: startX, y: startY};
        this.moveHistory = [{ x: startX, y: startY }];
        this.totalMoves = 0;
    }
}

// Maze Class
class Maze {
    grid: number[][];
    size: number;
    startPosition: Position;
    helmetPosition: Position;

    constructor(size: number = 30) {
        this.size = size;
        this.grid = [];
        this.startPosition = {x: 1, y: 1};
        this.helmetPosition = {x: size - 2, y: size - 2};
    }

    generate(): void {
        // Initialize grid with walls
        this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(1));
        
        // Wikipedia Algorithm: Recursive Backtracking for complex paths
        this.recursiveBacktracking();
        
        // Wall constraint: Ensure helmet position never has walls
        this.grid[this.helmetPosition.y][this.helmetPosition.x] = 0;
        
        // Hunt-and-Kill for additional complexity
        this.huntAndKill();
        
        // Create misleading fake paths with BFS complexity
        this.generateComplexFakePaths();
        
        // Validate path complexity (anti-"L" shape)
        if (!this.validatePathComplexity()) {
            this.generate(); // Regenerate if too simple
            return;
        }
        
        // Ensure at least one correct route exists
        this.ensureHelmetAccessibility();
    }

    validateHelmetAccessibility(): boolean {
        const visited = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
        const queue: Position[] = [{...this.startPosition}];
        visited[this.startPosition.y][this.startPosition.x] = true;

        while (queue.length > 0) {
            const current = queue.shift()!;

            if (current.x === this.helmetPosition.x && current.y === this.helmetPosition.y) {
                return true;
            }

            const directions = [
                {dx: 0, dy: -1}, {dx: 0, dy: 1},
                {dx: -1, dy: 0}, {dx: 1, dy: 0}
            ];

            directions.forEach(dir => {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;

                if (this.isValidMove({x: nx, y: ny}) && !visited[ny][nx]) {
                    visited[ny][nx] = true;
                    queue.push({x: nx, y: ny});
                }
            });
        }

        return false;
    }

    isValidMove(position: Position): boolean {
        return position.x >= 0 && position.x < this.size &&
            position.y >= 0 && position.y < this.size &&
            this.grid[position.y][position.x] === 0;
    }

    private recursiveBacktracking(): void {
        // Wikipedia Recursive Backtracking Algorithm
        const stack: Position[] = [];
        const visited = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
        
        // Start from random odd position to ensure single-width paths
        const startX = 1 + (Math.floor(Math.random() * ((this.size - 2) / 2)) * 2);
        const startY = 1 + (Math.floor(Math.random() * ((this.size - 2) / 2)) * 2);
        
        this.grid[startY][startX] = 0;
        visited[startY][startX] = true;
        stack.push({ x: startX, y: startY });

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = this.getUnvisitedCells(current, visited);

            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                
                // Remove wall between current and next (single-width corridor)
                const wallX = (current.x + next.x) / 2;
                const wallY = (current.y + next.y) / 2;
                this.grid[wallY][wallX] = 0;
                this.grid[next.y][next.x] = 0;
                
                visited[next.y][next.x] = true;
                stack.push(next);
            } else {
                stack.pop();
            }
        }
        
        // Ensure start and helmet positions are accessible
        this.grid[this.startPosition.y][this.startPosition.x] = 0;
        this.connectToMaze(this.startPosition, visited);
        this.connectToMaze(this.helmetPosition, visited);
    }

    private huntAndKill(): void {
        // Wikipedia Hunt-and-Kill Algorithm for additional complexity
        const visited = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
        
        // Mark existing paths as visited
        for (let y = 1; y < this.size - 1; y += 2) {
            for (let x = 1; x < this.size - 1; x += 2) {
                if (this.grid[y][x] === 0) {
                    visited[y][x] = true;
                }
            }
        }

        let huntX = 1, huntY = 1;
        
        while (huntY < this.size - 1) {
            // Hunt phase: find unvisited cell adjacent to visited cell
            if (!visited[huntY][huntX] && this.hasVisitedNeighbor(huntX, huntY, visited)) {
                // Kill phase: random walk from this cell
                this.randomWalk(huntX, huntY, visited);
            }
            
            // Move to next cell
            huntX += 2;
            if (huntX >= this.size - 1) {
                huntX = 1;
                huntY += 2;
            }
        }
    }

    private validatePathComplexity(): boolean {
        // Anti-"L" shape validation: ensure solution path has sufficient complexity
        const solutionPath = this.findSolutionPath();
        if (!solutionPath || solutionPath.length < 10) return false;
        
        const turnCount = this.countTurns(solutionPath);
        const directionChanges = this.countDirectionChanges(solutionPath);
        
        // Require minimum complexity (not simple "L" shape)
        return turnCount >= 4 && directionChanges >= 3;
    }

    findSolutionPath(): Position[] | null {
        // BFS to find actual solution path
        const queue: { pos: Position; path: Position[] }[] = [
            { pos: { ...this.startPosition }, path: [{ ...this.startPosition }] }
        ];
        const visited = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
        visited[this.startPosition.y][this.startPosition.x] = true;

        while (queue.length > 0) {
            const { pos, path } = queue.shift()!;
            
            if (pos.x === this.helmetPosition.x && pos.y === this.helmetPosition.y) {
                return path;
            }

            const directions = [
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
            ];

            directions.forEach(dir => {
                const nx = pos.x + dir.dx;
                const ny = pos.y + dir.dy;
                
                if (this.isValidMove({ x: nx, y: ny }) && !visited[ny][nx]) {
                    visited[ny][nx] = true;
                    queue.push({ 
                        pos: { x: nx, y: ny }, 
                        path: [...path, { x: nx, y: ny }] 
                    });
                }
            });
        }
        
        return null;
    }

    private countTurns(path: Position[]): number {
        if (path.length < 3) return 0;
        
        let turns = 0;
        for (let i = 1; i < path.length - 1; i++) {
            const prev = path[i - 1];
            const curr = path[i];
            const next = path[i + 1];
            
            const dir1 = { dx: curr.x - prev.x, dy: curr.y - prev.y };
            const dir2 = { dx: next.x - curr.x, dy: next.y - curr.y };
            
            // Count direction changes as turns
            if (dir1.dx !== dir2.dx || dir1.dy !== dir2.dy) {
                turns++;
            }
        }
        
        return turns;
    }

    private countDirectionChanges(path: Position[]): number {
        if (path.length < 2) return 0;
        
        let changes = 0;
        let lastDirection = { dx: 0, dy: 0 };
        
        for (let i = 1; i < path.length; i++) {
            const curr = path[i];
            const prev = path[i - 1];
            const direction = { dx: curr.x - prev.x, dy: curr.y - prev.y };
            
            if (i > 1 && (direction.dx !== lastDirection.dx || direction.dy !== lastDirection.dy)) {
                changes++;
            }
            
            lastDirection = direction;
        }
        
        return changes;
    }

    private getUnvisitedCells(pos: Position, visited: boolean[][]): Position[] {
        const neighbors: Position[] = [];
        const directions = [
            { dx: 0, dy: -2 }, { dx: 0, dy: 2 },
            { dx: -2, dy: 0 }, { dx: 2, dy: 0 }
        ];

        directions.forEach(dir => {
            const nx = pos.x + dir.dx;
            const ny = pos.y + dir.dy;
            
            if (nx >= 1 && nx < this.size - 1 && ny >= 1 && ny < this.size - 1 && !visited[ny][nx]) {
                neighbors.push({ x: nx, y: ny });
            }
        });

        return neighbors;
    }

    private randomWalk(startX: number, startY: number, visited: boolean[][]): void {
        let x = startX, y = startY;
        const path: Position[] = [];
        
        while (!visited[y][x]) {
            path.push({ x, y });
            visited[y][x] = true;
            
            const neighbors = this.getUnvisitedCells({ x, y }, visited);
            if (neighbors.length === 0) break;
            
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            
            // Create winding path (not direct)
            const wallX = (x + next.x) / 2;
            const wallY = (y + next.y) / 2;
            this.grid[wallY][wallX] = 0;
            this.grid[next.y][next.x] = 0;
            
            x = next.x;
            y = next.y;
        }
        
        // Connect to existing maze
        if (path.length > 0) {
            this.grid[path[0].y][path[0].x] = 0;
        }
    }

    private hasVisitedNeighbor(x: number, y: number, visited: boolean[][]): boolean {
        const directions = [
            { dx: 0, dy: -2 }, { dx: 0, dy: 2 },
            { dx: -2, dy: 0 }, { dx: 2, dy: 0 }
        ];
        
        return directions.some(dir => {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            return nx >= 1 && nx < this.size - 1 && ny >= 1 && ny < this.size - 1 && visited[ny][nx];
        });
    }

    private connectToMaze(pos: Position, visited: boolean[][]): void {
        // Connect important positions to the main maze
        if (this.grid[pos.y][pos.x] === 0) return;
        
        const directions = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ];
        
        for (const dir of directions) {
            const nx = pos.x + dir.dx;
            const ny = pos.y + dir.dy;
            
            if (this.isValidCell(nx, ny) && this.grid[ny][nx] === 0) {
                this.grid[pos.y][pos.x] = 0;
                return;
            }
        }
    }

    private generateBaseMaze(): void {
        // Deprecated - replaced by recursiveBacktracking and huntAndKill
    }

    private generateComplexFakePaths(): void {
        const fakePathCount = 25 + Math.floor(Math.random() * 11); // 25-35 fake paths
        
        for (let i = 0; i < fakePathCount; i++) {
            this.createMisleadingPath();
        }
    }

    private createMisleadingPath(): void {
        // Find wall cells adjacent to existing paths
        const candidates: Position[] = [];
        
        for (let y = 1; y < this.size - 1; y++) {
            for (let x = 1; x < this.size - 1; x++) {
                if (this.grid[y][x] === 1 && this.hasAdjacentPath(x, y)) {
                    candidates.push({ x, y });
                }
            }
        }
        
        if (candidates.length === 0) return;
        
        const start = candidates[Math.floor(Math.random() * candidates.length)];
        const pathLength = 3 + Math.floor(Math.random() * 8); // 3-10 cells for complexity
        
        this.extendMisleadingPath(start.x, start.y, pathLength);
    }

    private extendMisleadingPath(startX: number, startY: number, maxLength: number): void {
        let x = startX, y = startY;
        let length = 0;
        const visited = new Set<string>();
        
        while (length < maxLength && this.isValidCell(x, y)) {
            const key = `${x},${y}`;
            if (visited.has(key)) break; // Prevent infinite loops
            
            // Wall constraint: Don't override helmet position
            if (x === this.helmetPosition.x && y === this.helmetPosition.y) break;
            
            if (this.grid[y][x] === 1) {
                this.grid[y][x] = 0;
                visited.add(key);
                length++;
                
                // Single-width enforcement: Check for adjacent paths to prevent widening
                if (this.wouldCreateWideCorridors(x, y)) {
                    break; // Stop if this would create wide corridors
                }
                
                // Create branching for complexity (but maintain single-width)
                if (Math.random() < 0.3 && length > 2) {
                    this.createSingleWidthBranch(x, y, Math.min(3, maxLength - length));
                }
            }
            
            // Move in random direction (single step for 1x1 paths)
            const directions = [
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
            ];
            const dir = directions[Math.floor(Math.random() * directions.length)];
            x += dir.dx;
            y += dir.dy;
        }
    }

    private wouldCreateWideCorridors(x: number, y: number): boolean {
        // Check if creating a path here would result in 2x2 or larger open areas
        let adjacentPaths = 0;
        const directions = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ];
        
        directions.forEach(dir => {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            if (this.isValidCell(nx, ny) && this.grid[ny][nx] === 0) {
                adjacentPaths++;
            }
        });
        
        // If more than 2 adjacent paths, might create wide corridors
        return adjacentPaths > 2;
    }

    private createSingleWidthBranch(startX: number, startY: number, branchLength: number): void {
        const directions = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ];
        
        const dir = directions[Math.floor(Math.random() * directions.length)];
        let x = startX + dir.dx;
        let y = startY + dir.dy;
        
        for (let i = 0; i < branchLength && this.isValidCell(x, y); i++) {
            if (x === this.helmetPosition.x && y === this.helmetPosition.y) break;
            
            // Single-width enforcement: only create if it maintains 1x1 corridors
            if (this.grid[y][x] === 1 && !this.wouldCreateWideCorridors(x, y)) {
                this.grid[y][x] = 0;
            } else {
                break; // Stop branch if it would create wide corridors
            }
            
            x += dir.dx;
            y += dir.dy;
        }
    }

    private ensureHelmetAccessibility(): void {
        if (!this.validateHelmetAccessibility()) {
            // Create guaranteed path using BFS-guided approach
            this.createGuaranteedPath();
        }
    }

    private createGuaranteedPath(): void {
        // Use BFS to find shortest path and create it
        const queue: Position[] = [{ ...this.startPosition }];
        const visited = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
        const parent = new Map<string, Position>();
        
        visited[this.startPosition.y][this.startPosition.x] = true;
        
        while (queue.length > 0) {
            const current = queue.shift()!;
            
            if (current.x === this.helmetPosition.x && current.y === this.helmetPosition.y) {
                // Reconstruct and create path
                this.reconstructPath(parent, current);
                return;
            }
            
            const directions = [
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
            ];
            
            directions.forEach(dir => {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;
                
                if (this.isValidCell(nx, ny) && !visited[ny][nx]) {
                    visited[ny][nx] = true;
                    parent.set(`${nx},${ny}`, current);
                    queue.push({ x: nx, y: ny });
                }
            });
        }
    }

    private reconstructPath(parent: Map<string, Position>, end: Position): void {
        const path: Position[] = [];
        let current = end;
        
        while (current) {
            path.unshift(current);
            const key = `${current.x},${current.y}`;
            current = parent.get(key)!;
            if (!current) break;
        }
        
        // Create single-width path by setting cells to 0
        path.forEach(pos => {
            this.grid[pos.y][pos.x] = 0;
            // Ensure we don't accidentally create wide corridors
            this.validateSingleWidthAt(pos.x, pos.y);
        });
    }

    private validateSingleWidthAt(x: number, y: number): void {
        // Check surrounding area to ensure no 2x2 open blocks exist
        for (let dy = -1; dy <= 0; dy++) {
            for (let dx = -1; dx <= 0; dx++) {
                const checkPositions = [
                    { x: x + dx, y: y + dy },
                    { x: x + dx + 1, y: y + dy },
                    { x: x + dx, y: y + dy + 1 },
                    { x: x + dx + 1, y: y + dy + 1 }
                ];
                
                // If all 4 positions in a 2x2 block are paths, block one to maintain single-width
                const allPaths = checkPositions.every(pos => 
                    this.isValidCell(pos.x, pos.y) && this.grid[pos.y][pos.x] === 0
                );
                
                if (allPaths) {
                    // Block the bottom-right corner to maintain single-width corridors
                    const blockPos = checkPositions[3];
                    if (blockPos.x !== this.helmetPosition.x || blockPos.y !== this.helmetPosition.y) {
                        if (blockPos.x !== this.startPosition.x || blockPos.y !== this.startPosition.y) {
                            this.grid[blockPos.y][blockPos.x] = 1;
                        }
                    }
                }
            }
        }
    }

    private hasAdjacentPath(x: number, y: number): boolean {
        const directions = [
            {dx: 0, dy: -1}, {dx: 0, dy: 1},
            {dx: -1, dy: 0}, {dx: 1, dy: 0}
        ];

        return directions.some(dir => {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            return this.isValidCell(nx, ny) && this.grid[ny][nx] === 0;
        });
    }

    private getUnvisitedNeighbors(pos: Position, visited: boolean[][]): Position[] {
        const neighbors: Position[] = [];
        const directions = [
            {dx: 0, dy: -2}, {dx: 0, dy: 2},
            {dx: -2, dy: 0}, {dx: 2, dy: 0}
        ];

        directions.forEach(dir => {
            const nx = pos.x + dir.dx;
            const ny = pos.y + dir.dy;

            if (this.isValidCell(nx, ny) && !visited[ny][nx]) {
                neighbors.push({x: nx, y: ny});
            }
        });

        return neighbors;
    }

    private isValidCell(x: number, y: number): boolean {
        return x >= 1 && x < this.size - 1 && y >= 1 && y < this.size - 1;
    }

}

// Game Class with automatic game end handling
class Game {
    labour: Labour;
    maze: Maze;
    timer: Timer;
    gameState: 'waiting' | 'playing' | 'won' | 'lost';
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    cellSize: number;
    stats: GameStats;

    constructor() {
        this.maze = new Maze(30);
        this.labour = new Labour(1, 1);
        this.timer = new Timer();
        this.gameState = 'waiting';
        this.stats = { completionTime: 0, pathEfficiency: 0, totalMoves: 0, optimalMoves: 0, score: 0 };

        // Set up automatic timer expiration handling
        this.timer.onExpired = () => this.onTimerExpired();

        this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.cellSize = this.canvas.width / this.maze.size;

        this.setupEventListeners();
        this.init();
    }

    init(): void {
        this.maze.generate();
        this.labour.reset(1, 1);
        this.timer.reset();
        this.gameState = 'waiting';
        this.updateStatus('Press WASD to start! Find the helmet in 30 seconds!');
        this.render();
    }

    setupEventListeners(): void {
        document.addEventListener('keydown', (e) => this.handleInput(e.key));

        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.restart());
        }
    }

    handleInput(key: string): void {
        if (this.gameState !== 'waiting' && this.gameState !== 'playing') return;

        const keyMap: { [key: string]: 'up' | 'down' | 'left' | 'right' } = {
            'w': 'up', 'W': 'up',
            's': 'down', 'S': 'down',
            'a': 'left', 'A': 'left',
            'd': 'right', 'D': 'right'
        };

        const direction = keyMap[key];
        if (!direction) return;

        if (this.gameState === 'waiting') {
            this.gameState = 'playing';
            this.timer.start();
            this.updateStatus('Find the helmet before time runs out!');
        }

        const newPos: Position = {...this.labour.position};
        switch (direction) {
            case 'up':
                newPos.y--;
                break;
            case 'down':
                newPos.y++;
                break;
            case 'left':
                newPos.x--;
                break;
            case 'right':
                newPos.x++;
                break;
        }

        if (this.maze.isValidMove(newPos)) {
            this.labour.move(direction);
            this.checkHelmetTouch();
        }

        this.render();
    }

    // Automatic timer expiration handler - fixes the bug
    onTimerExpired(): void {
        if (this.gameState === 'playing') {
            this.gameState = 'lost';
            this.updateStatus('No Helmet - Time expired!');
            this.showRetryButton();
            this.calculateStats();
        }
    }

    checkHelmetTouch(): boolean {
        if (this.labour.isAtPosition(this.maze.helmetPosition)) {
            this.gameState = 'won';
            this.timer.stop();
            this.updateStatus('Helmet earned! You win!');
            this.showRetryButton();
            this.calculateStats();
            return true;
        }
        return false;
    }

    calculateStats(): void {
        const optimalPath = this.findOptimalPath();
        this.stats = {
            completionTime: this.timer.getElapsedTime(),
            pathEfficiency: this.labour.calculatePathEfficiency(optimalPath || []),
            totalMoves: this.labour.totalMoves,
            optimalMoves: optimalPath ? optimalPath.length - 1 : 0,
            score: this.calculateScore()
        };
    }

    calculateScore(): number {
        const timeBonus = Math.max(0, this.timer.remaining * 10);
        const efficiencyBonus = this.stats?.pathEfficiency ? this.stats.pathEfficiency * 100 : 0;
        return Math.round(timeBonus + efficiencyBonus);
    }

    findOptimalPath(): Position[] | null {
        // Use the existing findSolutionPath from maze
        return this.maze.findSolutionPath();
    }

    showRetryButton(): void {
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.style.opacity = "1";
            retryBtn.style.pointerEvents = 'auto';
        }
    }

    hideRetryButton(): void {
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.style.opacity = "0";
            retryBtn.style.pointerEvents = 'none';
        }
    }

    restart(): void {
        this.hideRetryButton();
        this.init();
    }

    updateStatus(message: string): void {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    render(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Render maze
        for (let y = 0; y < this.maze.size; y++) {
            for (let x = 0; x < this.maze.size; x++) {
                const cellX = x * this.cellSize;
                const cellY = y * this.cellSize;

                if (this.maze.grid[y][x] === 1) {
                    // Wall
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);
                    this.renderEmoji('🚧', cellX, cellY);
                } else {
                    // Path
                    this.ctx.fillStyle = '#333';
                    this.ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);
                }
            }
        }

        // Render helmet
        const helmetX = this.maze.helmetPosition.x * this.cellSize;
        const helmetY = this.maze.helmetPosition.y * this.cellSize;
        this.renderEmoji('🪖', helmetX, helmetY);

        // Render labour
        const labourX = this.labour.position.x * this.cellSize;
        const labourY = this.labour.position.y * this.cellSize;
        const labourEmoji = this.gameState === 'won' ? '👷🏻‍♂️' : '👨🏻‍🔧';
        this.renderEmoji(labourEmoji, labourX, labourY);
    }

    renderEmoji(emoji: string, x: number, y: number): void {
        this.ctx.font = `${this.cellSize * 0.8}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(emoji, x + this.cellSize / 2, y + this.cellSize / 2);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
