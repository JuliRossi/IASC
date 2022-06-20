const io = require("socket.io-client");
const express = require("express");
const app = express();

const socket = io("http://localhost:3000");

// receive a message from the server
socket.on("hello from server", (arg1,arg2) => {
    console.log(arg1 + " " +arg2)


    // send a message to the server
    socket.emit("hello from client", "Hola! Soy el cliente",arg2);
});

socket.on('disconnect', () => {
    console.log('user disconnected');
});
