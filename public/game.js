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

window.onload = () => {
    const playerNameElement = document.getElementById('playerName');
    const patternArea = document.getElementById('patternArea');
    const shapesContainer = document.getElementById('shapesContainer');
    const timerElement = document.getElementById('timer');
    let timer = 88;

    playerNameElement.textContent = `${playerName}, Draw your pattern.`;

    // Create shape options
    shapes.forEach((shape, index) => {
        const shapeOption = document.createElement('div');
        shapeOption.classList.add('shapeOption');
        shapeOption.style.backgroundColor = shape.color;
        shapeOption.dataset.shape = shape.shape;
        shapeOption.draggable = true;
        
        // Append shape-specific classes for visual representation
        if (shape.shape === 'quarter-circle') {
            shapeOption.classList.add('quarter-circle');
        } else if (shape.shape === 'half-circle') {
            shapeOption.classList.add('half-circle');
        } else if (shape.shape === 'three-quarter-circle') {
            shapeOption.classList.add('three-quarter-circle');
        }
        
        shapesContainer.appendChild(shapeOption);

        shapeOption.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('shape', JSON.stringify(shape));
        });

        // Add click event listener for placing shapes by click
        shapeOption.addEventListener('click', (e) => {
            placeShape(shape);
        });
    });

    // Function to place shape at a specific position
    function placeShape(shape) {
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
        shapeElement.style.left = `${patternArea.offsetWidth / 2 - 25}px`; // Center horizontally
        shapeElement.style.top = `${patternArea.offsetHeight / 2 - 25}px`; // Center vertically
        shapeElement.dataset.shape = shape.shape;
        patternArea.appendChild(shapeElement); // Append to patternArea
    }

    // Countdown timer
    const countdown = setInterval(() => {
        if (timer > 0) {
            timer--;
            timerElement.textContent = timer;
        } else {
            clearInterval(countdown);
            // Emit pattern creation to server
            const pattern = [];
            patternArea.querySelectorAll('.shape').forEach(shape => {
                pattern.push({
                    color: shape.style.backgroundColor,
                    shape: shape.dataset.shape,
                    x: shape.style.left,
                    y: shape.style.top
                });
            });
            socket.emit('sendShape', { roomId: 'room1', shape: pattern });
        }
    }, 1000);
};

// Socket events handling (placeholders)
socket.on('receiveShape', (receivedShape) => {
    // Handle received shape if needed
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
