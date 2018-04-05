#!/usr/bin/env node

var io = require('socket.io')(3000, { serveClient: false });

console.log("started");

io.on('connect', (socket) => {
    console.log("connected");

    const intervalId = setInterval(() => {
        console.log('hello');
        socket.emit('hello', {'hello': 'world'});
    }, 10000);

    socket.on('hello', (data) => {
        console.log(`client: ${socket.client.conn}`);
        console.log('data: ', JSON.stringify(data));
        console.log('hello: ', data.hello);
    });

    socket.on('disconnect', () => {
        clearInterval(intervalId);
        console.log('disconnected');
    });

})
