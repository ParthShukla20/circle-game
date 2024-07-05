const socket = io();

const playerName = "Parth"; // Example player name
let shapes = [
    { color: 'yellow', shape: 'half-circle1' },
    { color: 'yellow', shape: 'half-circle2' },
    { color: 'purple', shape: 'quarter-circle1' },
    { color: 'purple', shape: 'quarter-circle2' },
    { color: 'blue', shape: 'pie1' },
    { color: 'blue', shape: 'pie2' }
];

let currentPlayer = 1; // Start with player 1
let player1Queue = [];
let player2Pattern = [];
let player1Wins = 0;
let player2Wins = 0;
let currentRound = 1;
const totalRounds = 3;

window.onload = () => {
    const playerNameElement = document.getElementById('playerName');
    const patternArea1 = document.getElementById('patternArea1');
    const patternArea2 = document.getElementById('patternArea2');
    const shapesContainer = document.getElementById('shapesContainer');
    const timerElement = document.getElementById('timer');
    const stopTimerButton = document.getElementById('stopTimerButton');
    let timer = 90;
    let countdown;
    let gameActive = true;

    playerNameElement.textContent = `${playerName}, Draw your pattern.`;

    // Create shape options
    shapes.forEach((shape, index) => {
        const shapeOption = document.createElement('div');
        shapeOption.classList.add('shapeOption');
        shapeOption.style.backgroundColor = 'black'; // Background color set to grey
        shapeOption.dataset.shape = shape.shape;

        // Create inner element for the actual shape
        const innerShape = document.createElement('div');
        innerShape.style.backgroundColor = shape.color;
        innerShape.classList.add('innerShape');

        // Append shape-specific classes for visual representation
        if (shape.shape === 'half-circle1') {
            innerShape.classList.add('half-circle1');
        } else if (shape.shape === 'half-circle2') {
            innerShape.classList.add('half-circle2');
        } else if (shape.shape === 'quarter-circle1') {
            innerShape.classList.add('quarter-circle1');
        } else if (shape.shape === 'quarter-circle2') {
            innerShape.classList.add('quarter-circle2');
        } else if (shape.shape === 'pie1') {
            innerShape.classList.add('pie1');
        } else if (shape.shape === 'pie2') {
            innerShape.classList.add('pie2');
        }

        shapeOption.appendChild(innerShape);
        shapesContainer.appendChild(shapeOption);

        // Add dragstart event listener for drag-and-drop
        shapeOption.addEventListener('dragstart', (e) => {
            if (gameActive) {
                e.dataTransfer.setData('shape', JSON.stringify(shape));
            } else {
                e.preventDefault();
            }
        });

        // Add click event listener for click-to-place
        shapeOption.addEventListener('click', (e) => {
            if (gameActive) {
                placeShape(shape);
            }
        });
    });

    // Function to place shape at a specific position
    function placeShape(shape) {
        if (!gameActive) return; // Do nothing if game is not active

        const patternArea = currentPlayer === 1 ? patternArea1 : patternArea2; // Determine the current pattern area

        const shapeElement = document.createElement('div');
        shapeElement.classList.add('shape');
        shapeElement.style.backgroundColor = shape.color;
        shapeElement.dataset.shape = shape.shape;

        // Adjust size and shape based on type
        if (shape.shape === 'half-circle1') {
            shapeElement.style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%)';
            shapeElement.style.transform = 'rotate(90deg)';
        } else if (shape.shape === 'half-circle2') {
            shapeElement.style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%)';
        } else if (shape.shape === 'pie1') {
            shapeElement.style.clipPath = 'polygon(50% 50%, 0% 0%, 100% 0%, 100% 100%, 50% 100%)';
        } else if (shape.shape === 'pie2') {
            shapeElement.style.clipPath = 'polygon(50% 50%, 0% 0%, 100% 0%, 100% 100%, 50% 100%)';
            shapeElement.style.transform = 'rotate(270deg)';
        } else if (shape.shape === 'quarter-circle1') {
            shapeElement.style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 100% 50%)';
        } else if (shape.shape === 'quarter-circle2') {
            shapeElement.style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 100% 50%)';
            shapeElement.style.transform = 'rotate(180deg)';
        }

        shapeElement.style.width = '50px';
        shapeElement.style.height = '50px';
        shapeElement.style.position = 'absolute'; // Ensure absolute positioning

        // Adjust the position based on the current player
        shapeElement.style.left = '0';
        shapeElement.style.top = '0';
        shapeElement.style.width = '100%';
        shapeElement.style.height = '100%';
        shapeElement.dataset.shape = shape.shape;

        patternArea.appendChild(shapeElement);

        // Record the shape and its position
        const shapeDetails = {
            color: shape.color,
            shape: shape.shape,
            x: shapeElement.style.left,
            y: shapeElement.style.top
        };

        // Add to queue for player 1, store for player 2
        if (currentPlayer === 1) {
            player1Queue.push(shapeDetails);
        } else {
            player2Pattern.push(shapeDetails);
        }
    }

    // Countdown timer
    function startTimer() {
        countdown = setInterval(() => {
            if (timer > 0) {
                timer--;
                timerElement.textContent = timer;
            } else {
                clearInterval(countdown);
                endTurn();
            }
        }, 1000);
    }

    startTimer();

    // Stop timer button event listener
    stopTimerButton.addEventListener('click', () => {
        clearInterval(countdown);
        endTurn();
    });

    // Function to end the current player's turn
    function endTurn() {
        gameActive = false;

        if (currentPlayer === 1) {
            socket.emit('sendShape', { roomId: 'room1', pattern: player1Queue });
            currentPlayer = 2;
            playerNameElement.textContent = `Player 2, Draw your pattern.`;
            gameActive = true; // Allow second player to draw
            timer = 90;
            startTimer();
        } else {
            determineRoundWinner();
        }
    }

    // Function to determine the round winner
    function determineRoundWinner() {
        // Compare player2Pattern with player1Queue
        const isMatch = player2Pattern.every((shape, index) => {
            return (
                shape.shape === player1Queue[index].shape &&
                shape.color === player1Queue[index].color &&
                shape.x === player1Queue[index].x &&
                shape.y === player1Queue[index].y
            );
        });

        if (isMatch && player2Pattern.length === player1Queue.length) {
            player2Wins++;
            alert('Player 2 wins this round!');
        } else {
            player1Wins++;
            alert('Player 1 wins this round!');
        }

        // Check if we have an overall winner
        if (player1Wins === 2) {
            alert('Player 1 wins the match!');
            socket.emit('gameResult', { winner: 'Player 1', loser: 'Player 2' });
        } else if (player2Wins === 2) {
            alert('Player 2 wins the match!');
            socket.emit('gameResult', { winner: 'Player 2', loser: 'Player 1' });
        } else {
            // Start a new round
            startNewRound();
        }
    }

    // Function to start a new round
    function startNewRound() {
        currentRound++;
        if (currentRound > totalRounds) {
            if (player1Wins > player2Wins) {
                alert('Player 1 wins the match!');
                socket.emit('gameResult', { winner: 'Player 1', loser: 'Player 2' });
            } else {
                alert('Player 2 wins the match!');
                socket.emit('gameResult', { winner: 'Player 2', loser: 'Player 1' });
            }
        } else {
            player1Queue = [];
            player2Pattern = [];
            patternArea1.innerHTML = ''; // Clear the pattern area for Player 1
            patternArea2.innerHTML = ''; // Clear the pattern area for Player 2
            currentPlayer = 1;
            gameActive = true;
            playerNameElement.textContent = `Player 1, Draw your pattern for Round ${currentRound}.`;
            timer = 90;
            startTimer();
        }
    }

    // Socket events handling
    socket.on('receiveShape', ({ pattern }) => {
        const currentPatternArea = currentPlayer === 2 ? patternArea2 : patternArea1;
        currentPatternArea.innerHTML = ''; // Clear the current player's pattern area
        pattern.forEach(shape => {
            const shapeElement = document.createElement('div');
            shapeElement.classList.add('shape');
            shapeElement.style.backgroundColor = shape.color;

            // Adjust size and shape based on type
            if (shape.shape === 'half-circle1') {
                shapeElement.style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%)';
                shapeElement.style.transform = 'rotate(90deg)';
            } else if (shape.shape === 'half-circle2') {
                shapeElement.style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%)';
            } else if (shape.shape === 'pie1') {
                shapeElement.style.clipPath = 'polygon(50% 50%, 0% 0%, 100% 0%, 100% 100%, 50% 100%)';
            } else if (shape.shape === 'pie2') {
                shapeElement.style.clipPath = 'polygon(50% 50%, 0% 0%, 100% 0%, 100% 100%, 50% 100%)';
                shapeElement.style.transform = 'rotate(270deg)';
            } else if (shape.shape === 'quarter-circle1') {
                shapeElement.style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 100% 50%)';
            } else if (shape.shape === 'quarter-circle2') {
                shapeElement.style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 100% 50%)';
                shapeElement.style.transform = 'rotate(180deg)';
            }

            shapeElement.style.width = '50px';
            shapeElement.style.height = '50px';
            shapeElement.style.position = 'absolute';
            shapeElement.style.left = shape.x;
            shapeElement.style.top = shape.y;
            shapeElement.dataset.shape = shape.shape;
            currentPatternArea.appendChild(shapeElement);
        });
    });

    socket.on('gameResult', ({ winner, loser }) => {
        // Handle game result if needed
        if (socket.id === winner) {
            alert('You won!');
        } else {
            alert('You lost!');
        }
    });

    // Handle new player joining
    socket.on('playerJoined', (players) => {
        // Update UI with new player list if needed
    });

    // Handle player leaving
    socket.on('playerLeft', (players) => {
        // Update UI with new player list if needed
    });

    // Example room creation
    socket.emit('createRoom', 'room1');
};
