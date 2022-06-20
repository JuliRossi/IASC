const { Server } = require("socket.io");
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = new Server(server);

var count = 1;

io.on("connection", (socket) => {
    // send a message to the client
    console.log("Se conecto un cliente")

    socket.emit("hello from server", "Sos el cliente", count++);

    // receive a message from the client
    socket.on("hello from client", (arg1,arg2) => {
        console.log(arg1 + " " + arg2)
    });

    socket.on('disconnect', () => {
        console.log('user');
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});

app.use(express.json());

app.post('/buyers', (req, res) => {
    req.body;
    res.json(req.body);
    console.log( req.body)
});
