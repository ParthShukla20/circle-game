const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const path = require('path');
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: false }));

let rooms = {};

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('createRoom', (roomId) => {
        rooms[roomId] = { players: [socket.id], shapes: {} };
        socket.join(roomId);
        console.log(`Room ${roomId} created by ${socket.id}`);
    });

    socket.on('joinRoom', (roomId) => {
        if (rooms[roomId] && rooms[roomId].players.length < 2) {
            rooms[roomId].players.push(socket.id);
            socket.join(roomId);
            console.log(`${socket.id} joined room ${roomId}`);
            io.to(roomId).emit('startGame');
        } else {
            socket.emit('roomFull');
        }
    });

    socket.on('sendShape', ({ roomId, shape }) => {
        rooms[roomId].shapes[socket.id] = shape;
        const opponentId = rooms[roomId].players.find(id => id !== socket.id);
        io.to(opponentId).emit('receiveShape', shape);
    });

    socket.on('checkShape', ({ roomId, shape }) => {
        const originalShape = rooms[roomId].shapes[rooms[roomId].players.find(id => id !== socket.id)];
        if (JSON.stringify(originalShape) === JSON.stringify(shape)) {
            io.to(roomId).emit('gameResult', { winner: socket.id, loser: rooms[roomId].players.find(id => id !== socket.id) });
        } else {
            io.to(roomId).emit('gameResult', { winner: rooms[roomId].players.find(id => id !== socket.id), loser: socket.id });
        }
    });

    socket.on('disconnect', () => {
        console.log('a user disconnected');
        for (const roomId in rooms) {
            const index = rooms[roomId].players.indexOf(socket.id);
            if (index !== -1) {
                rooms[roomId].players.splice(index, 1);
                if (rooms[roomId].players.length === 0) {
                    delete rooms[roomId];
                }
                break;
            }
        }
    });
});

app.get('/game',(req,res)=>{

     res.sendFile(path.join(__dirname, 'public', 'Home.html'));
})
app.post('/start',(req,res)=>{

    const name = req.body.name
    console.log(name)
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})
server.listen(3000, () => {
    console.log('listening on *:3000');
});
