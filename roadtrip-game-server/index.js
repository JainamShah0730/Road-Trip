import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'


dotenv.config()

const app = express()
app.use(cors())

const rooms = {}
const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: { origin: '*' }
})

const PORT = process.env.PORT || 5000;

app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`)

    socket.on('join-room', (roomCode) => {
        socket.join(roomCode)
        socket.data.roomCode = roomCode

        if (!rooms[roomCode]) {
            rooms[roomCode] = { players: {} }
        }
        rooms[roomCode].players[socket.id] = { x: 0, y: 0.5, z: 0, rotationY: 0 }

        console.log(`${socket.id} joined room ${roomCode}. Players in room: ${Object.keys(rooms[roomCode].players).length}`)

        socket.emit('room-state', rooms[roomCode].players)

        socket.to(roomCode).emit('player-joined', { playerId: socket.id, ...rooms[roomCode].players[socket.id] })

        socket.on('activity-result', (result) => {
            const roomCode = socket.data.roomCode;
            if (!roomCode) return;
            io.to(roomCode).emit('activity-result-broadcast', { playerId: socket.id, ...result });
        });
    })


    socket.on('position-update', (pos) => {
        const roomCode = socket.data.roomCode
        if (!roomCode || !rooms[roomCode]) return;

        rooms[roomCode].players[socket.id] = { ...pos }
        socket.to(roomCode).emit('player-moved', { playerId: socket.id, ...pos })
    })

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`)
        const roomCode = socket.data.roomCode
        if (roomCode && rooms[roomCode]) {
            delete rooms[roomCode].players[socket.id]
            socket.to(roomCode).emit('player-left', { playerId: socket.id })

            if (Object.keys(rooms[roomCode].players).length === 0) {
                delete rooms[roomCode]
            }
        }
    })
})

httpServer.listen(PORT, () => {
    console.log(`game-server running on port ${PORT}`)
})