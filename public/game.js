const socket = io();

const playerName = "Parth"; // Example player name
let shapes = [
    { color: 'yellow', shape: 'quarter-circle' }, 
    { color: 'yellow', shape: 'quarter-circle' }, 
    { color: 'purple', shape: 'half-circle' }, 
    { color: 'purple', shape: 'half-circle' }, 
    { color: 'blue', shape: 'three-quarter-circle' }, 
    { color: 'blue', shape: 'three-quarter-circle' }
];

let currentPlayer = 1; // Start with player 1
let player1Pattern = [];
let player2Pattern = [];
let player1Wins = 0;
let player2Wins = 0;
let currentRound = 1;
const totalRounds = 3;

window.onload = () => {
    const playerNameElement = document.getElementById('playerName');
    const patternArea = document.getElementById('patternArea');
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
        shapeOption.style.backgroundColor = 'white'; // Background color set to white
        shapeOption.dataset.shape = shape.shape;

        // Create inner element for the actual shape
        const innerShape = document.createElement('div');
        innerShape.style.backgroundColor = shape.color;
        innerShape.classList.add('innerShape');

        // Append shape-specific classes for visual representation
        if (shape.shape === 'quarter-circle') {
            innerShape.classList.add('quarter-circle');
        } else if (shape.shape === 'half-circle') {
            innerShape.classList.add('half-circle');
        } else if (shape.shape === 'three-quarter-circle') {
            innerShape.classList.add('three-quarter-circle');
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

        const shapeElement = document.createElement('div');
        shapeElement.classList.add('shape');
        shapeElement.style.backgroundColor = shape.color;

        // Adjust size and shape based on type
        if (shape.shape === 'quarter-circle') {
            shapeElement.style.borderRadius = '50% 0 0 0';
        } else if (shape.shape === 'half-circle') {
            shapeElement.style.borderRadius = '50%';
        } else if (shape.shape === 'three-quarter-circle') {
            shapeElement.style.borderRadius = '0 50% 0 0';
        }

        shapeElement.style.width = '50px';
        shapeElement.style.height = '50px';
        shapeElement.style.position = 'absolute'; // Ensure absolute positioning
        
        // Adjust the position based on the current player
        if (currentPlayer === 1) {
            shapeElement.style.left = `${patternArea.offsetWidth / 4 - 25}px`; // Center horizontally for Player 1
        } else {
            shapeElement.style.left = `${(patternArea.offsetWidth / 4) * 3 - 25}px`; // Center horizontally for Player 2
        }
        
        shapeElement.style.top = `${patternArea.offsetHeight / 2 - 25}px`; // Center vertically
        shapeElement.dataset.shape = shape.shape;
        patternArea.appendChild(shapeElement); // Append to patternArea
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

        const pattern = [];
        patternArea.querySelectorAll('.shape').forEach(shape => {
            pattern.push({
                color: shape.style.backgroundColor,
                shape: shape.dataset.shape,
                x: shape.style.left,
                y: shape.style.top
            });
        });

        if (currentPlayer === 1) {
            player1Pattern = pattern;
            socket.emit('sendShape', { roomId: 'room1', pattern: player1Pattern });
            currentPlayer = 2;
            playerNameElement.textContent = `Player 2, Draw your pattern.`;
            gameActive = true; // Allow second player to draw
            timer = 90;
            startTimer();
        } else {
            player2Pattern = pattern;
            determineRoundWinner();
        }
    }

    // Function to determine the round winner
    function determineRoundWinner() {
        // Simple comparison logic to check if the patterns are the same
        const patternsMatch = JSON.stringify(player1Pattern) === JSON.stringify(player2Pattern);

        if (patternsMatch) {
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
            player1Pattern = [];
            player2Pattern = [];
            patternArea.innerHTML = ''; // Clear the pattern area
            currentPlayer = 1;
            gameActive = true;
            playerNameElement.textContent = `Player 1, Draw your pattern for Round ${currentRound}.`;
            timer = 90;
            startTimer();
        }
    }

    // Socket events handling
    socket.on('receiveShape', ({ pattern }) => {
        if (currentPlayer === 2) {
            // Display Player 1's pattern for Player 2
            player1Pattern = pattern;
            player1Pattern.forEach(shape => {
                const shapeElement = document.createElement('div');
                shapeElement.classList.add('shape');
                shapeElement.style.backgroundColor = shape.color;
                shapeElement.dataset.shape = shape.shape;
                shapeElement.style.width = '50px';
                shapeElement.style.height = '50px';
                shapeElement.style.position = 'absolute';
                shapeElement.style.left = shape.x;
                shapeElement.style.top = shape.y;
                patternArea.appendChild(shapeElement);
            });
        }
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
