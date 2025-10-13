// Position interface
interface Position {
    x: number;
    y: number;
}

// Timer Class
class Timer {
    duration: number = 30;
    remaining: number = 30;
    active: boolean = false;
    private intervalId: any = null;

    start(): void {
        if (this.active) return;
        this.active = true;
        this.intervalId = setInterval(() => {
            this.remaining--;
            this.updateDisplay();
            if (this.remaining <= 0) {
                this.stop();
            }
        }, 1000);
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

    private updateDisplay(): void {
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = `Time: ${this.remaining}s`;
        }
    }
}

// Labour Class
class Labour {
    position: Position;

    constructor(startX: number, startY: number) {
        this.position = {x: startX, y: startY};
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
    }

    isAtPosition(pos: Position): boolean {
        return this.position.x === pos.x && this.position.y === pos.y;
    }

    reset(startX: number, startY: number): void {
        this.position = {x: startX, y: startY};
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
        this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(1));
        this.generateBasePaths();
        // Wall constraint: Ensure helmet position never has walls
        this.grid[this.helmetPosition.y][this.helmetPosition.x] = 0;
        this.addFakePaths();
        // Remove infinite recursion - validate once only
        if (!this.validateHelmetAccessibility()) {
            // If not accessible, ensure path to helmet exists
            this.createDirectPath();
        }
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

    private generateBasePaths(): void {
        const stack: Position[] = [];
        const visited = Array(this.size).fill(null).map(() => Array(this.size).fill(false));

        this.grid[this.startPosition.y][this.startPosition.x] = 0;
        visited[this.startPosition.y][this.startPosition.x] = true;
        stack.push({...this.startPosition});

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = this.getUnvisitedNeighbors(current, visited);

            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                this.grid[next.y][next.x] = 0;
                visited[next.y][next.x] = true;
                stack.push(next);
            } else {
                stack.pop();
            }
        }
    }

    private addFakePaths(): void {
        const fakePathCount = 25 + Math.floor(Math.random() * 11);
        for (let i = 0; i < fakePathCount; i++) {
            this.createFakePath();
        }
    }

    private createFakePath(): void {
        for (let attempts = 0; attempts < 100; attempts++) {
            const x = 1 + Math.floor(Math.random() * (this.size - 2));
            const y = 1 + Math.floor(Math.random() * (this.size - 2));

            if (this.grid[y][x] === 1 && this.hasAdjacentPath(x, y)) {
                const length = 2 + Math.floor(Math.random() * 11);
                this.extendFakePath(x, y, length);
                break;
            }
        }
    }

    private extendFakePath(startX: number, startY: number, maxLength: number): void {
        let x = startX, y = startY;
        let length = 0;

        while (length < maxLength && this.isValidCell(x, y) && this.grid[y][x] === 1) {
            // Wall constraint: Don't override helmet position
            if (x === this.helmetPosition.x && y === this.helmetPosition.y) break;

            this.grid[y][x] = 0;
            length++;

            const directions = [
                {dx: 0, dy: -1}, {dx: 0, dy: 1},
                {dx: -1, dy: 0}, {dx: 1, dy: 0}
            ];
            const dir = directions[Math.floor(Math.random() * directions.length)];
            x += dir.dx;
            y += dir.dy;
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

    private createDirectPath(): void {
        // Create direct path from start to helmet if not accessible
        let x = this.startPosition.x;
        let y = this.startPosition.y;

        // Move right to helmet x position
        while (x < this.helmetPosition.x) {
            this.grid[y][x] = 0;
            x++;
        }

        // Move down to helmet y position
        while (y < this.helmetPosition.y) {
            this.grid[y][x] = 0;
            y++;
        }

        // Ensure helmet position is open
        this.grid[this.helmetPosition.y][this.helmetPosition.x] = 0;
    }
}

// Game Class
class Game {
    labour: Labour;
    maze: Maze;
    timer: Timer;
    gameState: 'waiting' | 'playing' | 'won' | 'lost';
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    cellSize: number;

    constructor() {
        this.maze = new Maze(30);
        this.labour = new Labour(1, 1);
        this.timer = new Timer();
        this.gameState = 'waiting';

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
        this.checkTimeExpired();
    }

    checkHelmetTouch(): boolean {
        if (this.labour.isAtPosition(this.maze.helmetPosition)) {
            this.gameState = 'won';
            this.timer.stop();
            this.updateStatus('Helmet earned! You win!');
            this.showRetryButton();
            return true;
        }
        return false;
    }

    checkTimeExpired(): boolean {
        if (this.timer.isExpired() && this.gameState === 'playing') {
            this.gameState = 'lost';
            this.updateStatus('No Helmet - Time expired!');
            this.showRetryButton();
            return true;
        }
        return false;
    }

    showRetryButton(): void {
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.style.opacity = "1";
            retryBtn.style.pointerEvents = 'cursor';
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
