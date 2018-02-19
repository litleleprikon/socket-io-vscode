#!/usr/bin/env node

var io = require('socket.io')(3000, { serveClient: false });

console.log("started");

io.on('connect', (socket) => {
    console.log("connected");

    socket.on('hello', (data) => {
        console.log(`client: ${socket.client}, data:\n${JSON.stringify(data)}`)
    });

    setInterval(() => {
        console.log('hello');
        socket.emit('hello', {'hello': 'world'});
    }, 10000);
})