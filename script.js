const column = 10; // Grid width
const row = 20;    // Grid height
let board = [];    // 2D array storing the grid state
let currentShape;  // The active falling piece layout
let currentColor;  // The active falling piece color

// Score system
let score = 0;
let highScore = localStorage.getItem("tetrisHighScore") || 0;

// Create and style the score UI
let scoreBoard = document.createElement("div");
scoreBoard.style.fontSize = "20px";
scoreBoard.style.fontWeight = "bold";
scoreBoard.style.marginBottom = "10px";
document.body.appendChild(scoreBoard);

// Updates the visible score text
function updateScore() {
    scoreBoard.innerHTML = `Score: ${score} | High Score: ${highScore}`;
}
updateScore();


// Base class for blocks
class Block {
    constructor(shape, color) {
        this.shape = shape;
        this.color = color;
    }
}

// | piece
class IBlock extends Block {
    constructor() { super([[1, 1, 1, 1]], "cyan"); }
}

// ■ piece
class OBlock extends Block {
    constructor() { super([[1, 1], [1, 1]], "yellow"); }
}

// T piece
class TBlock extends Block {
    constructor() { super([[0, 1, 0], [1, 1, 1]], "purple"); }
}

// L piece
class LBlock extends Block {
    constructor() { super([[1, 0, 0], [1, 1, 1]], "orange"); }
}

// ⅃ piece
class JBlock extends Block {
    constructor() { super([[0, 0, 1], [1, 1, 1]], "blue"); }
}

// S piece
class SBlock extends Block {
    constructor() { super([[0, 1, 1], [1, 1, 0]], "green"); }
}

// Z piece
class ZBlock extends Block {
    constructor() { super([[1, 1, 0], [0, 1, 1]], "red"); }
}

// Blocks
const blockTypes = [IBlock, OBlock, TBlock, LBlock, JBlock, SBlock, ZBlock];



// Create board
function createBoard() {
    let grid = document.createElement(`table`);
    grid.style.borderCollapse = "collapse";
    grid.style.backgroundColor = "black";
     
    for (let r = 0; r < row; r++) {
        let tableRow = document.createElement(`tr`);
        let rowArray = []; 
        
        for (let c = 0; c < column; c++) {
            let cell = new Cell(c, r); // Create a new cell object
            rowArray.push(cell); 
            tableRow.appendChild(cell.td);
        }
        board.push(rowArray); 
        grid.appendChild(tableRow);
    }
    document.body.appendChild(grid);
}

// What the grid is made of
class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.td = this.generateCellDiv();
        this.collide = false; // Tracks if a locked piece occupies this cell
    } 
    
    // Creates the HTML table data cell
    generateCellDiv() {
        let td = document.createElement(`td`);
        td.style.width = "15px";
        td.style.height = "15px"; 
        td.style.backgroundColor = "transparent";
        return td;
    }
}


// Base class for the player and controls
class player {
    constructor () {
        this.spawnPiece();

        // Keyboard controls and Event listners
        document.addEventListener('keydown', function(key) {
            switch (key.keyCode) {
                case 38: // Up Arrow
                    let rotatedShape = [];
                    // Rotation
                    for (let c = 0; c < currentShape[0].length; c++) {
                        let newRow = [];
                        for (let r = currentShape.length - 1; r >= 0; r--) {
                            newRow.push(currentShape[r][c]);
                        }
                        rotatedShape.push(newRow);
                    }
                    // Change currentShape with rotatedShape
                    if (activePlayer.checkCollision(rotatedShape, activePlayer.x, activePlayer.y) == false) {
                        currentShape = rotatedShape;
                        update();
                    }
                    break;

                case 37: // Left Arrow
                    if (activePlayer.checkCollision(currentShape, activePlayer.x - 1, activePlayer.y) == false) {
                        activePlayer.x--;
                        update();
                    }
                    break;
                
                case 39: // Right Arrow
                    if (activePlayer.checkCollision(currentShape, activePlayer.x + 1, activePlayer.y) == false) {
                        activePlayer.x++;
                        update();
                    }
                    break;
                
                case 40: // Down Arrow
                    if (activePlayer.checkCollision(currentShape, activePlayer.x, activePlayer.y + 1) == false) {
                        activePlayer.y++;
                        update();
                    }
                    break;
            }
        });
    }
    
    // Chooses random block and places it at the top.
    spawnPiece() {
        let randomIndex = Math.floor(Math.random() * blockTypes.length);
        let newBlock = new blockTypes[randomIndex](); 
        
        currentShape = newBlock.shape;
        currentColor = newBlock.color;
        
        this.x = 3; // Starting x position
        this.y = -1; // Starting y position
    }

    // Moves the block down
    gravity() {
        if (this.checkCollision(currentShape, this.x, this.y + 1) == false) {
            this.y++; // Go down by 1
        } else {
            this.lockPiece(); // Stop moving if it hits the floor or another piece
        }
    }

    // Checks if a proposed move hits the walls, floor, or a locked block
    checkCollision(cs, checkX, checkY) {
        for (let r = 0; r < cs.length; r++) {
            for (let c = 0; c < cs[r].length; c++) {
                if (cs[r][c] == 1) { // Only check solid parts of the shape
                    let testX = checkX + c;
                    let testY = checkY + r;

                    // Check if block is widthin the board
                    if (testX < 0 || testX >= column || testY >= row) {
                        return true; 
                    }

                    // Check if it collides with locked blocks
                    if (testY >= 0 && board[testY][testX].collide == true) {
                        return true;
                    }
                }
            }
        }
        return false; // No collision
    }

    // Keep block placed
    lockPiece() {
        for (let r = 0; r < currentShape.length; r++) {
            for (let c = 0; c < currentShape[r].length; c++) {
                if (currentShape[r][c] == 1) {
                    let lockY = this.y + r;
                    let lockX = this.x + c;
                    
                    if (lockY >= 0) {
                        board[lockY][lockX].collide = true;
                        board[lockY][lockX].color = currentColor;
                        board[lockY][lockX].td.style.backgroundColor = currentColor;
                    }
                }
            }
        }
        
        this.clearLines(); // Check if line is complete
        this.spawnPiece(); // Spawn new block
    }

    // Checks for full rows, removes them, and spawns bolck
    clearLines() {
        let clearedLine = 0;

        for (let r = 19; r >= 0; r--) { 
            let isFull = true;
            
            // Check if every cell in the row is filled
            for (let c = 0; c < column; c++) { 
                if (board[r][c].collide == false) {
                    isFull = false;
                    break;
                }
            }
            
            // Execute row clear
            if (isFull == true) {
                clearedLine++;

                // Shift all rows down by 1
                for (let moveRow = r; moveRow > 0; moveRow--) {
                    for (let c = 0; c < column; c++) { 
                        board[moveRow][c].collide = board[moveRow - 1][c].collide;
                        board[moveRow][c].td.style.backgroundColor = board[moveRow - 1][c].td.style.backgroundColor;
                    }
                }
                
                // Clear the top row
                for (let c = 0; c < column; c++) { 
                    board[0][c].collide = false;
                    board[0][c].td.style.backgroundColor = "transparent";
                    r++; // Recheck the current rows
                }
                
            }
        }

        // Apply scoring and save high score
        if (clearedLine > 0) {
            score += (clearedLine * 100);
            
            if (score > highScore) {
                highScore = score;
                localStorage.setItem("tetrisHighScore", highScore);
            }
            
            updateScore();
        }
    }
}



// Update game
function update() {
    // Remove old color
    for (let r = 0; r < row; r++) {
        for (let c = 0; c < column; c++) {
            if (board[r][c].collide == false) { 
                board[r][c].color = "transparent"; 
                board[r][c].td.style.backgroundColor = "transparent"; 
            }
        }
    }

    // Update player
    for (let r = 0; r < currentShape.length; r++) {
        for (let c = 0; c < currentShape[r].length; c++) {
            if (currentShape[r][c] == 1) {
                let updateY = activePlayer.y + r;
                let updateX = activePlayer.x + c;

                // Update player visuals
                if (updateY >= 0 && updateY < row && updateX >= 0 && updateX < column) {
                    board[updateY][updateX].color = currentColor;
                    board[updateY][updateX].td.style.backgroundColor = currentColor;
                }
            } 
        }
    }
}



createBoard();
let activePlayer = new player(); // Active player

// Main game loop
setInterval(function() {
    activePlayer.gravity();
    update();
}, 200);