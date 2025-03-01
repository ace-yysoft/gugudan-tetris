// 브라우저 환경에서만 실행되도록 코드를 감싸줍니다
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // 캔버스 및 컨텍스트 설정
    const canvas = document.getElementById('tetris');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const messageElement = document.getElementById('message');
    const gugudanElement = document.getElementById('gugudan');
    const answerElement = document.getElementById('answer');

    // 홀드, 다음 블록 미리보기, 레벨 요소 설정
    const holdCanvas = document.getElementById('hold');
    const holdCtx = holdCanvas.getContext('2d');
    const nextCanvas = document.getElementById('next');
    const nextCtx = nextCanvas.getContext('2d');
    const levelElement = document.getElementById('level');
    const gameOverElement = document.querySelector('.game-over');
    const finalScoreElement = document.getElementById('final-score');
    const finalLevelElement = document.getElementById('final-level');
    const restartButton = document.getElementById('restart-button');

    // 캔버스 크기 설정
    ctx.scale(20, 20);
    holdCtx.scale(15, 15);
    nextCtx.scale(15, 15);

    // 게임 상태 변수
    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;
    let score = 0;
    let level = 1;
    let gameOver = false;
    let holdPiece = null;
    let canHold = true;
    let nextPiece = null;

    // 블록 색상 정의
    const colors = [
        null,
        '#FF0D72', // T
        '#0DC2FF', // I
        '#0DFF72', // J
        '#F538FF', // L
        '#FF8E0D', // O
        '#FFE138', // S
        '#3877FF'  // Z
    ];

    // 구구단 관련 변수
    let currentQuestion = null;
    let currentAnswer = null;
    let missionClear = false;

    // 테트로미노 모양 정의
    const pieces = 'TIJLOSZT';

    // 테트로미노 생성 함수
    function createPiece(type) {
        if (type === 'T') {
            return [
                [0, 0, 0],
                [1, 1, 1],
                [0, 1, 0],
            ];
        } else if (type === 'I') {
            return [
                [0, 2, 0, 0],
                [0, 2, 0, 0],
                [0, 2, 0, 0],
                [0, 2, 0, 0],
            ];
        } else if (type === 'J') {
            return [
                [0, 3, 0],
                [0, 3, 0],
                [3, 3, 0],
            ];
        } else if (type === 'L') {
            return [
                [0, 4, 0],
                [0, 4, 0],
                [0, 4, 4],
            ];
        } else if (type === 'O') {
            return [
                [5, 5],
                [5, 5],
            ];
        } else if (type === 'S') {
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0],
            ];
        } else if (type === 'Z') {
            return [
                [7, 7, 0],
                [0, 7, 7],
                [0, 0, 0],
            ];
        }
    }

    // 플레이어 객체 초기화
    const player = {
        pos: {x: 0, y: 0},
        matrix: null,
        score: 0,
    };

    // 구구단 문제 생성 함수
    function createGugudanQuestion() {
        const num1 = Math.floor(Math.random() * 8) + 2;
        const num2 = Math.floor(Math.random() * 9) + 1;
        currentQuestion = `${num1} × ${num2} = ?`;
        currentAnswer = num1 * num2;
        gugudanElement.textContent = currentQuestion;
        missionClear = false;
        messageElement.textContent = '구구단을 풀어서 블록을 제거하세요!';
        messageElement.classList.remove('mission-clear');
    }

    // 충돌 감지 함수
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

    // 아레나(게임판) 생성 함수
    function createMatrix(w, h) {
        const matrix = [];
        while (h--) {
            matrix.push(new Array(w).fill(0));
        }
        return matrix;
    }

    // 아레나와 플레이어 매트릭스 병합 함수
    function merge(arena, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }

    // 행 제거 함수
    function arenaSweep() {
        let rowCount = 0;
        outer: for (let y = arena.length - 1; y > 0; --y) {
            for (let x = 0; x < arena[y].length; ++x) {
                if (arena[y][x] === 0) {
                    continue outer;
                }
            }

            const row = arena.splice(y, 1)[0].fill(0);
            arena.unshift(row);
            ++y;
            rowCount++;
        }

        if (rowCount > 0) {
            player.score += rowCount * 100 * level;
            scoreElement.textContent = player.score;
            
            // 레벨 업 체크
            checkLevelUp();
        }
    }

    // 레벨 업 체크 함수
    function checkLevelUp() {
        const newLevel = Math.floor(player.score / 1000) + 1;
        if (newLevel > level) {
            level = newLevel;
            levelElement.textContent = level;
            // 레벨이 올라갈 때마다 블록이 떨어지는 속도 증가
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
            messageElement.textContent = `레벨 업! 레벨 ${level}`;
            setTimeout(() => {
                if (!gameOver) {
                    messageElement.textContent = '구구단을 풀어서 블록을 제거하세요!';
                }
            }, 2000);
        }
    }

    // 플레이어 드롭 함수
    function playerDrop() {
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

    // 플레이어 이동 함수
    function playerMove(dir) {
        player.pos.x += dir;
        if (collide(arena, player)) {
            player.pos.x -= dir;
        }
    }

    // 플레이어 리셋 함수
    function playerReset() {
        // 다음 블록이 없으면 생성
        if (!nextPiece) {
            nextPiece = createPiece(pieces[pieces.length * Math.random() | 0]);
        }
        
        player.matrix = nextPiece;
        nextPiece = createPiece(pieces[pieces.length * Math.random() | 0]);
        
        // 다음 블록 미리보기 업데이트
        drawNext();
        
        player.pos.y = 0;
        player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
        
        // 게임 오버 체크
        if (collide(arena, player)) {
            showGameOver();
        }
        
        // 홀드 사용 가능하도록 리셋
        canHold = true;
    }

    // 게임 오버 표시 함수
    function showGameOver() {
        gameOver = true;
        finalScoreElement.textContent = player.score;
        finalLevelElement.textContent = level;
        gameOverElement.classList.add('show');
        messageElement.textContent = '게임 오버!';
    }

    // 게임 재시작 함수
    function restartGame() {
        // 게임 상태 초기화
        arena.forEach(row => row.fill(0));
        player.score = 0;
        score = 0;
        level = 1;
        dropInterval = 1000;
        gameOver = false;
        holdPiece = null;
        canHold = true;
        
        // UI 업데이트
        scoreElement.textContent = '0';
        levelElement.textContent = '1';
        messageElement.textContent = '구구단을 풀어서 블록을 제거하세요!';
        gameOverElement.classList.remove('show');
        
        // 새 구구단 문제 생성
        createGugudanQuestion();
        
        // 새 블록 생성
        nextPiece = createPiece(pieces[pieces.length * Math.random() | 0]);
        playerReset();
        
        // 홀드 영역 초기화
        holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
        
        // 게임 루프 재시작
        update();
    }

    // 블록 회전 함수
    function playerRotate(dir) {
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

    // 매트릭스 회전 함수
    function rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [
                    matrix[x][y],
                    matrix[y][x],
                ] = [
                    matrix[y][x],
                    matrix[x][y],
                ];
            }
        }

        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }

    // 블록 홀드 함수
    function holdBlock() {
        if (!canHold) return;
        
        if (holdPiece === null) {
            holdPiece = player.matrix;
            playerReset();
        } else {
            const temp = player.matrix;
            player.matrix = holdPiece;
            holdPiece = temp;
            
            player.pos.y = 0;
            player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
        }
        
        // 홀드 사용 후 다시 사용할 수 없도록 설정
        canHold = false;
        
        // 홀드 블록 그리기
        drawHold();
    }

    // 홀드 블록 그리기 함수
    function drawHold() {
        holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
        
        if (holdPiece) {
            // 홀드 블록 중앙에 그리기
            const offsetX = (holdCanvas.width / 15 - holdPiece[0].length) / 2;
            const offsetY = (holdCanvas.height / 15 - holdPiece.length) / 2;
            
            holdPiece.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        holdCtx.fillStyle = colors[value];
                        holdCtx.fillRect(x + offsetX, y + offsetY, 1, 1);
                        holdCtx.strokeStyle = 'black';
                        holdCtx.lineWidth = 0.05;
                        holdCtx.strokeRect(x + offsetX, y + offsetY, 1, 1);
                    }
                });
            });
        }
    }

    // 다음 블록 그리기 함수
    function drawNext() {
        nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        
        if (nextPiece) {
            // 다음 블록 중앙에 그리기
            const offsetX = (nextCanvas.width / 15 - nextPiece[0].length) / 2;
            const offsetY = (nextCanvas.height / 15 - nextPiece.length) / 2;
            
            nextPiece.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        nextCtx.fillStyle = colors[value];
                        nextCtx.fillRect(x + offsetX, y + offsetY, 1, 1);
                        nextCtx.strokeStyle = 'black';
                        nextCtx.lineWidth = 0.05;
                        nextCtx.strokeRect(x + offsetX, y + offsetY, 1, 1);
                    }
                });
            });
        }
    }

    // 블록 즉시 드롭 함수
    function hardDrop() {
        while (!collide(arena, player)) {
            player.pos.y++;
        }
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        dropCounter = 0;
    }

    // 점수 업데이트 함수
    function updateScore() {
        scoreElement.textContent = player.score;
    }

    // 그리기 함수
    function draw() {
        // 배경 지우기
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 아레나와 플레이어 그리기
        drawMatrix(arena, {x: 0, y: 0});
        drawMatrix(player.matrix, player.pos);
    }

    // 매트릭스 그리기 함수
    function drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillStyle = colors[value];
                    ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 0.05;
                    ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
                }
            });
        });
    }

    // 업데이트 함수
    function update(time = 0) {
        if (gameOver) return;
        
        const deltaTime = time - lastTime;
        lastTime = time;

        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }

        draw();
        requestAnimationFrame(update);
    }

    // 구구단 답변 체크 함수
    function checkAnswer() {
        const userAnswer = parseInt(answerElement.value);
        if (userAnswer === currentAnswer) {
            missionClear = true;
            messageElement.textContent = '정답입니다!';
            messageElement.classList.add('mission-clear');
            answerElement.value = '';
            createGugudanQuestion();
        } else {
            messageElement.textContent = '틀렸습니다. 다시 시도하세요.';
            setTimeout(() => {
                if (!gameOver) {
                    messageElement.textContent = '구구단을 풀어서 블록을 제거하세요!';
                }
            }, 1000);
        }
    }

    // 키보드 이벤트 리스너
    document.addEventListener('keydown', event => {
        if (gameOver) return;
        
        if (event.keyCode === 37) {
            // 왼쪽 화살표
            playerMove(-1);
        } else if (event.keyCode === 39) {
            // 오른쪽 화살표
            playerMove(1);
        } else if (event.keyCode === 40) {
            // 아래쪽 화살표
            playerDrop();
        } else if (event.keyCode === 38) {
            // 위쪽 화살표 (회전)
            playerRotate(1);
        } else if (event.keyCode === 32) {
            // 스페이스바 (하드 드롭)
            hardDrop();
        } else if (event.keyCode === 67 || event.keyCode === 16) {
            // C 키 또는 Shift 키 (홀드)
            holdBlock();
        } else if (event.keyCode === 13) {
            // 엔터 키 (구구단 답변 제출)
            checkAnswer();
        }
    });

    // 답변 입력 필드 엔터 키 이벤트
    answerElement.addEventListener('keydown', event => {
        if (event.keyCode === 13) {
            checkAnswer();
            event.preventDefault();
        }
    });

    // 재시작 버튼 이벤트 리스너
    restartButton.addEventListener('click', restartGame);

    // 아레나 초기화
    const arena = createMatrix(12, 20);

    // 게임 시작 시 초기화
    // 다음 블록 미리 생성
    nextPiece = createPiece(pieces[pieces.length * Math.random() | 0]);
    
    // 초기 블록 생성 및 게임 시작
    createGugudanQuestion();
    playerReset();
    updateScore();
    levelElement.textContent = level;
    
    // 홀드 영역 초기화 (빈 상태로)
    holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
    
    // 게임 루프 시작
    update();
} 