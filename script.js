const canvas = document.getElementById('tetris');
if (!canvas) {
    console.error('Canvas element not found');
}
const context = canvas.getContext('2d');
if (!context) {
    console.error('2D context not available');
}
context.scale(20, 20);

// 구구단 관련 변수 추가
let currentMultiplier = 2; // 현재 단 (2단부터 시작)
let currentNumber = 1;     // 현재 숫자 (1부터 시작)
let gugudanCompleted = 0;  // 완료한 구구단 개수

// 구구단 문제 업데이트 함수
function updateGugudan() {
    const gugudanElement = document.getElementById('current-gugudan');
    if (gugudanElement) {
        gugudanElement.textContent = `${currentMultiplier} x ${currentNumber} = ${currentMultiplier * currentNumber}`;
    } else {
        console.error('Gugudan element not found');
    }
}

// 다음 구구단 문제로 이동
function nextGugudan() {
    currentNumber++;
    if (currentNumber > 9) {
        currentNumber = 1;
        currentMultiplier++;
        if (currentMultiplier > 9) {
            currentMultiplier = 2; // 9단까지 완료하면 다시 2단부터
        }
        gugudanCompleted++;
    }
    updateGugudan();
}

// 미션 클리어 메시지 표시
function showMissionClear() {
    const messageElement = document.getElementById('mission-message');
    if (messageElement) {
        messageElement.textContent = "구구단 Mission Clear!";
        messageElement.classList.add('mission-clear');
        
        // 3초 후 메시지 제거
        setTimeout(() => {
            messageElement.textContent = "";
            messageElement.classList.remove('mission-clear');
        }, 3000);
    } else {
        console.error('Message element not found');
    }
}

function arenaSweep() {
    let rowCount = 1;
    let rowsCleared = 0;
    
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        rowCount *= 2;
        rowsCleared++;
    }
    
    // 줄이 하나라도 완성되면 구구단 진행 및 메시지 표시
    if (rowsCleared > 0) {
        nextGugudan();
        showMissionClear();
    }
    
    updateScore();
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    console.log('Creating piece of type:', type);
    
    if (type === 'T') {
        return [
            [0, 0, 0],
            [5, 5, 5],
            [0, 5, 0],
        ];
    } else if (type === 'O') {
        // This code makes a square block for the game.
        // The block is made of the number 7.
        // It looks like this:
        // 7 7
        // 7 7
        return [
            [7, 7],
            [7, 7],
        ];
    } else if (type === 'L') {
        return [
            [0, 6, 0],
            [0, 6, 0],
            [0, 6, 6],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'I') {
        return [
            [0, 4, 0, 0],
            [0, 4, 0, 0],
            [0, 4, 0, 0],
            [0, 4, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 2, 2],
            [2, 2, 0],
            [0, 0, 0],
        ];
    } else if (type === 'Z') {
        return [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0],
        ];
    }
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x,
                                 y + offset.y,
                                 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // 배경에 "이윤재" 텍스트 추가
    context.save();
    context.globalAlpha = 0.5; // 투명도를 높여 더 선명하게
    context.font = 'bold 3px Arial'; // 폰트 크기 증가
    context.fillStyle = '#00BFFF'; // 찐한 하늘색(DeepSkyBlue)
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // 캔버스 중앙에 텍스트 그리기
    context.fillText("이윤재", 6, 10);
    
    // 상태 복원
    context.restore();

    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    console.log('Rotating matrix:', matrix, 'direction:', dir);
    
    // 행렬 복사본 생성
    const newMatrix = matrix.map(row => [...row]);
    
    // 행렬 회전
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < matrix[y].length; ++x) {
            if (dir > 0) {
                // 시계 방향 회전
                matrix[y][x] = newMatrix[matrix.length - 1 - x][y];
            } else {
                // 반시계 방향 회전
                matrix[y][x] = newMatrix[x][matrix.length - 1 - y];
            }
        }
    }
    
    console.log('Rotated matrix:', matrix);
}

function playerDrop() {
    console.log('Dropping piece');
    
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    const pieces = 'TJLOSZI';
    const pieceType = pieces[Math.floor(Math.random() * pieces.length)];
    console.log('Selected piece type:', pieceType);
    
    player.matrix = createPiece(pieceType);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    
    console.log('Player position:', player.pos);
    console.log('Player matrix:', player.matrix);
    
    if (collide(arena, player)) {
        console.log('Collision detected on reset');
        arena.forEach(row => row.fill(0));
        player.score = 0;
        resetGugudan(); // 구구단 초기화
        updateScore();
    }
}

function playerRotate(dir) {
    console.log('Rotating piece:', dir);
    
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.innerText = player.score;
    } else {
        console.error('Score element not found');
    }
}

const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

const arena = createMatrix(12, 20);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
};

document.addEventListener('keydown', event => {
    console.log('Key pressed:', event.key, event.keyCode);
    
    if (event.key === 'ArrowLeft' || event.keyCode === 37) {
        playerMove(-1);
    } else if (event.key === 'ArrowRight' || event.keyCode === 39) {
        playerMove(1);
    } else if (event.key === 'ArrowDown' || event.keyCode === 40) {
        playerDrop();
    } else if (event.key === 'ArrowUp' || event.keyCode === 38) {
        playerRotate(1); // 위쪽 화살표 키로 시계 방향 회전
    } else if (event.key === ' ' || event.keyCode === 32) {
        // 스페이스바로 즉시 드롭
        playerHardDrop();
    }
});

// 즉시 드롭 함수 추가
function playerHardDrop() {
    console.log('Hard dropping piece');
    
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    
    // 충돌이 발생하면 한 칸 위로 이동
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
    dropCounter = 0;
}

// 게임 초기화 시 구구단도 초기화
function resetGugudan() {
    currentMultiplier = 2;
    currentNumber = 1;
    gugudanCompleted = 0;
    updateGugudan();
}

console.log('Game starting...');
playerReset();
updateScore();
updateGugudan(); // 구구단 문제 표시
update();